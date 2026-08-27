import fs from 'node:fs';
import path from 'node:path';

const isProductionLaunch = process.env.PRODUCTION_LAUNCH === 'true';
if (!isProductionLaunch) {
  console.log('Legal launch gate: preview/local build – production gate skipped.');
  process.exit(0);
}

const legalPath = path.resolve('src/data/legal.json');
const legal = JSON.parse(fs.readFileSync(legalPath, 'utf8'));
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
  errors.push('legal.launchApproved ist noch nicht auf true gesetzt.');
}

if (errors.length) {
  console.error('\nPRODUKTIONSDEPLOY BLOCKIERT – Legal Gate nicht bestanden:\n');
  for (const error of errors) console.error(`- ${error}`);
  console.error('\nErst nach finaler Prüfung der Betreiberangaben und Datenschutzhinweise freigeben.\n');
  process.exit(1);
}

console.log('Legal launch gate bestanden.');
