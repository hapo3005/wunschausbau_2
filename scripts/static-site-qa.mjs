import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const isProduction = process.env.PRODUCTION_LAUNCH === 'true' || process.argv.includes('--production');
const canonicalOrigin = 'https://www.wunschausbau.de';

if (!fs.existsSync(dist)) {
  console.error('Static QA: dist/ fehlt. Bitte zuerst npm run build ausführen.');
  process.exit(1);
}

const htmlFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
};
walk(dist);

const routeForFile = (file) => {
  const rel = path.relative(dist, file).replaceAll(path.sep, '/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
};

const normalizeInternalPath = (href) => {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return null;
  let url;
  try {
    url = new URL(href, 'https://example.invalid/');
  } catch {
    return null;
  }
  if (url.origin !== 'https://example.invalid' && !url.hostname.endsWith('github.io') && !url.hostname.endsWith('wunschausbau.de')) return null;
  let pathname = decodeURIComponent(url.pathname);
  pathname = pathname.replace(/^\/wunschausbau_2(?=\/|$)/, '') || '/';
  return pathname;
};

const targetExists = (pathname) => {
  if (pathname === '/') return fs.existsSync(path.join(dist, 'index.html'));
  const clean = pathname.replace(/^\//, '').replace(/\/$/, '');
  const candidates = [
    path.join(dist, clean),
    path.join(dist, clean, 'index.html'),
    path.join(dist, `${clean}.html`)
  ];
  return candidates.some((candidate) => fs.existsSync(candidate));
};

const errors = [];
const warnings = [];
const titleRoutes = new Map();
const descriptionRoutes = new Map();
let checkedLinks = 0;

const commercialRoute = (route) =>
  route === '/'
  || route === '/leistungen/'
  || route.startsWith('/leistungen/')
  || route === '/referenzen/'
  || route === '/ueber-uns/'
  || route === '/kontakt/';

const noindexAllowed = new Set(['/danke/', '/freigabe/', '/404.html']);
const unverifiedClaimPatterns = [
  { label: 'kostenlose Erstberatung', pattern: /kostenlose\s+Erstberatung/i },
  { label: '500+ Projekte', pattern: /\b500\+\s*(?:realisierte\s+)?Projekte\b/i },
  { label: '24-h-Reaktionszeit', pattern: /\b24\s*h(?:\.|\b)/i }
];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const route = routeForFile(file);
  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((m) => m[1].replace(/<[^>]*>/g, '').trim());
  const descriptions = [...html.matchAll(/<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/gi)].map((m) => m[1].trim());
  const canonicals = [...html.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1].trim());
  const h1s = [...html.matchAll(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/gi)];
  const noindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);
  const jsonLdBlocks = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim());

  if (route === '/agb/') errors.push('/agb/: Platzhalter-AGB darf nicht als öffentliche Build-Route existieren.');

  if (commercialRoute(route)) {
    for (const claim of unverifiedClaimPatterns) {
      if (claim.pattern.test(html)) errors.push(`${route}: nicht freigegebene Werbeaussage gefunden (${claim.label}).`);
    }
  }

  if (titles.length !== 1 || !titles[0]) errors.push(`${route}: genau ein nicht-leerer <title> erwartet.`);
  if (descriptions.length !== 1 || !descriptions[0]) errors.push(`${route}: genau eine Meta-Description erwartet.`);
  if (canonicals.length !== 1 || !canonicals[0]) errors.push(`${route}: genau ein Canonical-Link erwartet.`);
  if (h1s.length !== 1) errors.push(`${route}: genau eine H1 erwartet, gefunden ${h1s.length}.`);

  if (titles[0]) {
    if (titles[0].length > 68) warnings.push(`${route}: Title ist mit ${titles[0].length} Zeichen lang.`);
    if (!titleRoutes.has(titles[0])) titleRoutes.set(titles[0], []);
    titleRoutes.get(titles[0]).push(route);
  }

  if (descriptions[0]) {
    if (descriptions[0].length < 90 || descriptions[0].length > 180) warnings.push(`${route}: Meta-Description hat ${descriptions[0].length} Zeichen.`);
    if (!descriptionRoutes.has(descriptions[0])) descriptionRoutes.set(descriptions[0], []);
    descriptionRoutes.get(descriptions[0]).push(route);
  }

  if (commercialRoute(route) && titles[0] && !titles[0].includes('Wittlich')) {
    errors.push(`${route}: kommerzieller Title verliert den primären Local-SEO-Fokus Wittlich.`);
  }

  if (isProduction && canonicals[0]) {
    try {
      const canonical = new URL(canonicals[0]);
      if (canonical.origin !== canonicalOrigin) {
        errors.push(`${route}: Production-Canonical nutzt ${canonical.origin} statt ${canonicalOrigin}.`);
      }
    } catch {
      errors.push(`${route}: Canonical ist keine valide absolute URL.`);
    }
  }

  if (jsonLdBlocks.length !== 1) {
    errors.push(`${route}: genau ein zusammengeführter JSON-LD-Block erwartet, gefunden ${jsonLdBlocks.length}.`);
  } else {
    try {
      const structured = JSON.parse(jsonLdBlocks[0]);
      const graph = Array.isArray(structured?.['@graph']) ? structured['@graph'] : [];
      const typesFor = (node) => Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
      const types = new Set(graph.flatMap(typesFor).filter(Boolean));
      const business = graph.find((node) => typesFor(node).includes('HomeAndConstructionBusiness'));

      if (!types.has('WebSite')) errors.push(`${route}: WebSite-Schema fehlt im JSON-LD-Graph.`);
      if (!business) errors.push(`${route}: HomeAndConstructionBusiness-Schema fehlt im JSON-LD-Graph.`);
      if (route !== '/' && !types.has('BreadcrumbList')) errors.push(`${route}: BreadcrumbList-Schema fehlt.`);

      if (isProduction && jsonLdBlocks[0].includes('https://wunschausbau.de')) {
        errors.push(`${route}: Structured Data enthält noch den nicht-kanonischen Apex-Host.`);
      }

      if (isProduction && business) {
        const address = business.address;
        if (!address || typeof address !== 'object') {
          errors.push(`${route}: LocalBusiness-Adresse fehlt im Produktionsschema.`);
        } else {
          for (const field of ['streetAddress', 'postalCode', 'addressLocality', 'addressCountry']) {
            if (!String(address[field] || '').trim()) errors.push(`${route}: LocalBusiness-Adresse unvollständig (${field}).`);
          }
        }
        if (!String(business.telephone || '').trim()) errors.push(`${route}: LocalBusiness-Telefonnummer fehlt im Produktionsschema.`);
        if (business.url !== `${canonicalOrigin}/`) errors.push(`${route}: LocalBusiness-URL ist nicht ${canonicalOrigin}/.`);
        if (business['@id'] !== `${canonicalOrigin}/#business`) errors.push(`${route}: LocalBusiness-@id ist nicht kanonisch.`);
      }
    } catch (error) {
      errors.push(`${route}: JSON-LD ist nicht valide JSON (${String(error)}).`);
    }
  }

  if (isProduction && noindex && !noindexAllowed.has(route)) {
    errors.push(`${route}: produktive, regulär indexierbare Seite enthält noindex.`);
  }

  if (isProduction && !noindex && /\[(?:PLATZHALTER|TODO|TBD)\b/i.test(html)) {
    errors.push(`${route}: veröffentlichbarer HTML-Inhalt enthält einen Platzhalter.`);
  }

  const hrefs = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
  for (const href of hrefs) {
    const pathname = normalizeInternalPath(href);
    if (!pathname) continue;
    checkedLinks += 1;
    if (!targetExists(pathname)) errors.push(`${route}: interner Link nicht auflösbar: ${href}`);
  }
}

for (const [title, routes] of titleRoutes) {
  if (routes.length > 1) errors.push(`Doppelter Title auf ${routes.join(', ')}: ${title}`);
}
for (const [description, routes] of descriptionRoutes) {
  if (routes.length > 1) warnings.push(`Identische Meta-Description auf ${routes.join(', ')}: ${description}`);
}

const reportDir = path.join(root, 'qa-artifacts');
fs.mkdirSync(reportDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  productionMode: isProduction,
  canonicalOrigin,
  htmlFiles: htmlFiles.length,
  checkedLinks,
  uniqueTitles: titleRoutes.size,
  uniqueDescriptions: descriptionRoutes.size,
  errors,
  warnings
};
fs.writeFileSync(path.join(reportDir, 'static-site-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(
  path.join(reportDir, 'static-site-qa.md'),
  [
    '## Static Site QA',
    '',
    `- HTML-Seiten: ${htmlFiles.length}`,
    `- interne Links geprüft: ${checkedLinks}`,
    `- eindeutige Titles: ${titleRoutes.size}`,
    `- eindeutige Descriptions: ${descriptionRoutes.size}`,
    `- Canonical Production Host: ${canonicalOrigin}`,
    `- Fehler: ${errors.length}`,
    `- Hinweise: ${warnings.length}`,
    '',
    ...(errors.length ? ['### Fehler', ...errors.map((e) => `- ${e}`), ''] : []),
    ...(warnings.length ? ['### Hinweise', ...warnings.map((w) => `- ${w}`), ''] : [])
  ].join('\n')
);

if (warnings.length) warnings.forEach((warning) => console.warn(`WARN: ${warning}`));
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log(`Static QA bestanden: ${htmlFiles.length} HTML-Seiten, ${checkedLinks} interne Links, ${titleRoutes.size} eindeutige Titles.`);
