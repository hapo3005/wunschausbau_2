import fs from 'node:fs';
import path from 'node:path';

const targetDir = process.argv[2] || 'qa-artifacts/lighthouse';
const files = fs.existsSync(targetDir)
  ? fs.readdirSync(targetDir).filter((name) => name.endsWith('.json') && name !== 'lighthouse-summary.json')
  : [];
const isProduction = process.env.PRODUCTION_LAUNCH === 'true';

if (!files.length) {
  console.error(`Kein Lighthouse-JSON in ${targetDir} gefunden.`);
  process.exit(1);
}

const thresholds = isProduction
  ? {
      performance: 0.90,
      accessibility: 0.95,
      'best-practices': 0.95,
      seo: 0.95
    }
  : {
      performance: 0.85,
      accessibility: 0.95,
      'best-practices': 0.95
    };

const metricThresholds = {
  'cumulative-layout-shift': {
    maximum: 0.10,
    label: 'CLS'
  }
};

const reports = [];
const failures = [];

for (const file of files) {
  const fullPath = path.join(targetDir, file);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const scores = Object.fromEntries(
    Object.entries(data.categories || {}).map(([key, value]) => [key, value.score])
  );
  const metrics = Object.fromEntries(
    Object.entries(metricThresholds).map(([auditId]) => [auditId, data.audits?.[auditId]?.numericValue ?? null])
  );
  reports.push({ file, scores, metrics });

  for (const [category, minimum] of Object.entries(thresholds)) {
    const score = scores[category];
    if (typeof score !== 'number') {
      failures.push(`${file}: Lighthouse-Kategorie ${category} fehlt.`);
    } else if (score < minimum) {
      failures.push(`${file}: ${category} ${(score * 100).toFixed(0)} < ${(minimum * 100).toFixed(0)}`);
    }
  }

  for (const [auditId, threshold] of Object.entries(metricThresholds)) {
    const value = metrics[auditId];
    if (typeof value !== 'number') {
      failures.push(`${file}: Lighthouse-Metrik ${threshold.label} fehlt.`);
    } else if (value > threshold.maximum) {
      failures.push(`${file}: ${threshold.label} ${value.toFixed(3)} > ${threshold.maximum.toFixed(2)}`);
    }
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  productionMode: isProduction,
  thresholds,
  metricThresholds,
  reports,
  failures,
  note: isProduction
    ? 'Production verlangt mindestens 90 Performance sowie 95 Accessibility, Best Practices und SEO; CLS darf 0,10 nicht überschreiten.'
    : 'Preview verlangt mindestens 85 Performance sowie 95 Accessibility und Best Practices; CLS darf 0,10 nicht überschreiten. SEO wird wegen der absichtlichen noindex-Sperre nur reportet.'
};

fs.writeFileSync(path.join(targetDir, 'lighthouse-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

for (const report of reports) {
  const printable = Object.entries(report.scores)
    .map(([key, score]) => `${key}: ${typeof score === 'number' ? Math.round(score * 100) : 'n/a'}`)
    .join(' | ');
  const cls = report.metrics['cumulative-layout-shift'];
  console.log(`${report.file} -> ${printable} | CLS: ${typeof cls === 'number' ? cls.toFixed(3) : 'n/a'}`);
}

if (failures.length) {
  console.error('\nLighthouse-Gate fehlgeschlagen:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('\nLighthouse-Gate bestanden.');
