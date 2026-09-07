import fs from 'node:fs';
import path from 'node:path';

const isProductionBuild = process.env.PRODUCTION_LAUNCH === 'true';
const isReleaseAudit = process.argv.includes('--production');
const shouldRun = isProductionBuild || isReleaseAudit;

if (!shouldRun) {
  console.log('Launch gate: preview/local build – production gate skipped.');
  process.exit(0);
}

const legal = JSON.parse(fs.readFileSync(path.resolve('src/data/legal.json'), 'utf8'));
const release = JSON.parse(fs.readFileSync(path.resolve('src/data/release.json'), 'utf8'));
const errors = [];

const collectMarkdownFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectMarkdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files;
};

if (isProductionBuild && process.env.MANUAL_PRODUCTION_DEPLOY !== 'true') {
  errors.push('Live-Build ist nur über den freigegebenen manuellen Production-Workflow erlaubt.');
}

for (const field of ['unternehmen', 'inhaber', 'strasse', 'plz', 'ort', 'land', 'telefon', 'email']) {
  if (!String(legal[field] || '').trim()) errors.push(`Pflichtangabe fehlt: ${field}`);
}

if (!String(legal.mailProvider || '').trim()) {
  errors.push('E-Mail-/SMTP-Dienstleister ist für die Datenschutzerklärung noch nicht bestätigt.');
}

if (legal.vsbgStatus === 'pending') {
  errors.push('Status zur Verbraucherstreitbeilegung ist noch nicht bestätigt.');
}

if (legal.launchApproved !== true) {
  errors.push('Rechtliche Produktionsfreigabe fehlt: legal.launchApproved !== true.');
}

const releaseChecks = [
  ['serviceCatalogApproved', 'Finaler Leistungskatalog ist noch nicht bestätigt.'],
  ['serviceAreaApproved', 'Finales Einsatzgebiet ist noch nicht bestätigt.'],
  ['projectMediaApproved', 'Freigegebene Original-Projektbilder sind noch nicht vollständig eingesetzt.'],
  ['smtpDeliveryTestPassed', 'Reale Formularzustellung wurde noch nicht erfolgreich getestet.']
];

for (const [field, message] of releaseChecks) {
  if (release[field] !== true) errors.push(message);
}

if (release.projectMediaApproved === true) {
  const referenceDir = path.resolve('src/content/referenzen');
  const referenceFiles = collectMarkdownFiles(referenceDir);
  const publishedReferences = referenceFiles.filter((file) => {
    const source = fs.readFileSync(file, 'utf8');
    return /^published:\s*true\s*$/m.test(source);
  });

  if (publishedReferences.length < 3) {
    errors.push(`Projektmedien sind als freigegeben markiert, aber es sind nur ${publishedReferences.length} veröffentlichte reale Referenz(en) vorhanden; mindestens 3 sind für den Launch vorgesehen.`);
  }

  for (const file of publishedReferences) {
    const source = fs.readFileSync(file, 'utf8');
    if (/\b(?:PLATZHALTER|TODO|TBD)\b/i.test(source)) {
      errors.push(`Veröffentlichte Referenz enthält noch einen Platzhalter: ${path.relative(process.cwd(), file)}.`);
    }
  }

  const publicMediaPages = [
    path.resolve('src/pages/index.astro'),
    path.resolve('src/pages/en/index.astro')
  ];
  const forbiddenMediaCopy = [
    /Zum Launch ersetzen wir/i,
    /For launch, they will be replaced/i
  ];

  for (const file of publicMediaPages) {
    const source = fs.readFileSync(file, 'utf8');
    if (forbiddenMediaCopy.some((pattern) => pattern.test(source))) {
      errors.push(`Projektmedien sind als freigegeben markiert, aber die Seite enthält noch Launch-Platzhaltertext: ${path.relative(process.cwd(), file)}.`);
    }
  }
}

if (errors.length) {
  console.error('\nPRODUKTIONSDEPLOY BLOCKIERT – Release Gate nicht bestanden:\n');
  for (const error of errors) console.error(`- ${error}`);
  console.error('\nPreview-Builds bleiben möglich. Produktion erst nach belegbarer Freigabe aller Punkte.\n');
  process.exit(1);
}

console.log(isProductionBuild
  ? 'Release Gate bestanden: manueller Produktionsbuild ist freigegeben.'
  : 'Release Audit bestanden: Recht, Inhalte und Kontaktstrecke sind freigegeben.');
