import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const reportDir = path.join(root, 'qa-artifacts');
const errors = [];
const checks = [];

const pass = (label) => checks.push({ label, ok: true });
const fail = (label, detail) => {
  checks.push({ label, ok: false, detail });
  errors.push(`${label}: ${detail}`);
};

const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const routeFile = (route) => {
  if (route === '/') return path.join(dist, 'index.html');
  if (route === '/404.html') return path.join(dist, '404.html');
  return path.join(dist, route.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
};

if (!fs.existsSync(dist)) {
  console.error('UI consistency QA: dist/ fehlt. Bitte zuerst npm run build ausführen.');
  process.exit(1);
}

const requiredRoutes = [
  '/', '/leistungen/', '/referenzen/', '/ueber-uns/', '/kontakt/', '/danke/', '/404.html',
  '/en/', '/en/services/', '/en/references/', '/en/about/', '/en/contact/', '/en/thank-you/', '/en/404/'
];
for (const route of requiredRoutes) {
  const file = routeFile(route);
  if (fs.existsSync(file)) pass(`Build-Route ${route}`);
  else fail(`Build-Route ${route}`, 'fehlt im Build');
}

const serviceRoutePairs = [
  ['/leistungen/boeden/', '/en/services/flooring/'],
  ['/leistungen/innentueren/', '/en/services/interior-doors/'],
  ['/leistungen/fenster-aussentueren/', '/en/services/windows-exterior-doors/'],
  ['/leistungen/trockenbau/', '/en/services/drywall/'],
  ['/leistungen/sonnenschutz/', '/en/services/shading/'],
  ['/leistungen/holzterrassen/', '/en/services/timber-decking/'],
  ['/leistungen/komplettrenovierung/', '/en/services/complete-renovation/']
];
for (const [de, en] of serviceRoutePairs) {
  const deOk = fs.existsSync(routeFile(de));
  const enOk = fs.existsSync(routeFile(en));
  if (deOk && enOk) pass(`DE/EN-Parität ${de} ↔ ${en}`);
  else fail(`DE/EN-Parität ${de} ↔ ${en}`, `DE=${deOk ? 'ok' : 'fehlt'}, EN=${enOk ? 'ok' : 'fehlt'}`);
}

const mobileCta = read('src/components/MobileCta.astro');
const forbiddenHeroMutation = /heroCta|heroSecondary|\.ks-hero\s+\.ks-button|\.ks-hero\s+\.ks-textlink|\.href\s*=\s*phoneHref|\.href\s*=\s*contactHref/;
if (forbiddenHeroMutation.test(mobileCta)) {
  fail('Mobile CTA verändert keine Hero-Navigation', 'MobileCta greift wieder in Hero-CTA-Ziele oder -Elemente ein');
} else {
  pass('Mobile CTA verändert keine Hero-Navigation');
}

for (const source of ['src/pages/leistungen/[slug].astro', 'src/pages/en/services/[slug].astro']) {
  const text = read(source);
  const actions = text.match(/<div class="service-head__actions">([\s\S]*?)<\/div>/)?.[1] || '';
  if (!actions) {
    fail(`CTA-Markup ${source}`, 'service-head__actions nicht gefunden');
  } else if (/text-link/.test(actions)) {
    fail(`CTA-Markup ${source}`, 'alter text-link innerhalb der CTA-Gruppe gefunden');
  } else if ((actions.match(/class="btn(?:\s+btn--ghost)?"/g) || []).length < 2) {
    fail(`CTA-Markup ${source}`, 'erwartete primäre und sekundäre Buttons fehlen');
  } else {
    pass(`CTA-Markup ${source}`);
  }
}

const root404 = read('src/pages/404.astro');
if (/english404/.test(root404) && /window\.location\.replace\(english404\)/.test(root404) && exists('src/pages/en/404.astro')) {
  pass('Sprachsensitive 404');
} else {
  fail('Sprachsensitive 404', 'englische Fehlerroute oder Weiterleitung fehlt');
}

const enReferences = read('src/pages/en/references.astro');
if (/getCollection\('referenzen'\)/.test(enReferences) && exists('src/pages/en/references/[slug].astro')) {
  pass('Englische Referenzen nutzen freigegebene Projektdaten und Detailroute');
} else {
  fail('Englische Referenzen nutzen freigegebene Projektdaten und Detailroute', 'EN-Referenzen sind nicht an die Projekt-Collection gekoppelt');
}

const collectHtml = (dir) => {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectHtml(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
};

const germanUiPhrases = ['Projekt anfragen', 'Leistungen ansehen', 'Zur Startseite', 'Alle Leistungen', 'Fehler 404'];
const englishFiles = collectHtml(path.join(dist, 'en'));
for (const file of englishFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const leaked = germanUiPhrases.find((phrase) => html.includes(phrase));
  if (leaked) fail(`EN-Oberfläche ${path.relative(dist, file)}`, `deutsche UI-Phrase gefunden: ${leaked}`);
}
if (!errors.some((error) => error.startsWith('EN-Oberfläche'))) pass('Englische Build-Routen ohne deutsche CTA-/404-Phrasen');

fs.mkdirSync(reportDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  checks: checks.length,
  errors
};
fs.writeFileSync(path.join(reportDir, 'ui-consistency-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(
  path.join(reportDir, 'ui-consistency-qa.md'),
  [
    '## UI Consistency QA',
    '',
    `- Checks: ${checks.length}`,
    `- Fehler: ${errors.length}`,
    '',
    ...checks.map((check) => `- ${check.ok ? '✅' : '❌'} ${check.label}${check.detail ? ` — ${check.detail}` : ''}`)
  ].join('\n') + '\n'
);

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log(`UI Consistency QA bestanden: ${checks.length} Checks.`);
