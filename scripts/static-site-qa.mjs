import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const isProduction = process.env.PRODUCTION_LAUNCH === 'true' || process.argv.includes('--production');

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
let checkedLinks = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const route = routeForFile(file);
  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((m) => m[1].replace(/<[^>]*>/g, '').trim());
  const descriptions = [...html.matchAll(/<meta\s+name=["']description["']\s+content=["']([^"']*)["'][^>]*>/gi)].map((m) => m[1].trim());
  const canonicals = [...html.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1].trim());
  const h1s = [...html.matchAll(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/gi)];
  const noindex = /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);

  if (titles.length !== 1 || !titles[0]) errors.push(`${route}: genau ein nicht-leerer <title> erwartet.`);
  if (descriptions.length !== 1 || !descriptions[0]) errors.push(`${route}: genau eine Meta-Description erwartet.`);
  if (canonicals.length !== 1 || !canonicals[0]) errors.push(`${route}: genau ein Canonical-Link erwartet.`);
  if (h1s.length !== 1) errors.push(`${route}: genau eine H1 erwartet, gefunden ${h1s.length}.`);

  if (titles[0] && titles[0].length > 68) warnings.push(`${route}: Title ist mit ${titles[0].length} Zeichen lang.`);
  if (descriptions[0] && (descriptions[0].length < 90 || descriptions[0].length > 180)) warnings.push(`${route}: Meta-Description hat ${descriptions[0].length} Zeichen.`);

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

const reportDir = path.join(root, 'qa-artifacts');
fs.mkdirSync(reportDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  productionMode: isProduction,
  htmlFiles: htmlFiles.length,
  checkedLinks,
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

console.log(`Static QA bestanden: ${htmlFiles.length} HTML-Seiten, ${checkedLinks} interne Links geprüft.`);
