import fs from 'node:fs';
import path from 'node:path';

const targetDir = process.argv[2] || 'qa-artifacts/lighthouse';
const files = fs.existsSync(targetDir)
  ? fs.readdirSync(targetDir).filter((name) => name.endsWith('.json'))
  : [];

if (!files.length) {
  console.error(`Kein Lighthouse-JSON in ${targetDir} gefunden.`);
  process.exit(1);
}

const thresholds = {
  performance: 0.75,
  accessibility: 0.90,
  'best-practices': 0.90
};

const reports = [];
const failures = [];

for (const file of files) {
  const fullPath = path.join(targetDir, file);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const scores = Object.fromEntries(
    Object.entries(data.categories || {}).map(([key, value]) => [key, value.score])
  );
  reports.push({ file, scores });

  for (const [category, minimum] of Object.entries(thresholds)) {
    const score = scores[category];
    if (typeof score !== 'number') {
      failures.push(`${file}: Lighthouse-Kategorie ${category} fehlt.`);
    } else if (score < minimum) {
      failures.push(`${file}: ${category} ${(score * 100).toFixed(0)} < ${(minimum * 100).toFixed(0)}`);
    }
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  thresholds,
  reports,
  failures,
  note: 'SEO wird reportet, aber auf GitHub Pages nicht gegated, weil die Preview absichtlich noindex ist.'
};

fs.writeFileSync(path.join(targetDir, 'lighthouse-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

for (const report of reports) {
  const printable = Object.entries(report.scores)
    .map(([key, score]) => `${key}: ${typeof score === 'number' ? Math.round(score * 100) : 'n/a'}`)
    .join(' | ');
  console.log(`${report.file} -> ${printable}`);
}

if (failures.length) {
  console.error('\nLighthouse-Gate fehlgeschlagen:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('\nLighthouse-Gate bestanden.');
