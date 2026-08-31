import fs from 'node:fs';
import path from 'node:path';

const isProductionLaunch = process.env.PRODUCTION_LAUNCH === 'true' || process.argv.includes('--production');
if (!isProductionLaunch) {
  console.log('Launch gate: preview/local build – production gate skipped.');
  process.exit(0);
}

const legal = JSON.parse(fs.readFileSync(path.resolve('src/data/legal.json'), 'utf8'));
const release = JSON.parse(fs.readFileSync(path.resolve('src/data/release.json'), 'utf8'));
const errors = [];

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

if (errors.length) {
  console.error('\nPRODUKTIONSDEPLOY BLOCKIERT – Release Gate nicht bestanden:\n');
  for (const error of errors) console.error(`- ${error}`);
  console.error('\nPreview-Builds bleiben möglich. Produktion erst nach belegbarer Freigabe aller Punkte.\n');
  process.exit(1);
}

console.log('Release Gate bestanden: Recht, Inhalte und Kontaktstrecke sind freigegeben.');
