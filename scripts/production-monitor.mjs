import fs from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';

const baseUrl = new URL(process.env.MONITOR_BASE_URL || 'https://www.wunschausbau.de');
const timeoutMs = Number(process.env.MONITOR_TIMEOUT_MS || 15_000);
const slowWarningMs = Number(process.env.MONITOR_SLOW_WARNING_MS || 3_000);
const minCertificateDays = Number(process.env.MONITOR_MIN_CERT_DAYS || 14);
const outDir = path.resolve('qa-artifacts/monitoring');

const failures = [];
const warnings = [];
const checks = [];

const addFailure = (name, message, meta = {}) => failures.push({ name, message, ...meta });
const addWarning = (name, message, meta = {}) => warnings.push({ name, message, ...meta });

async function requestCheck(name, pathname, options = {}) {
  const expectedStatus = options.expectedStatus ?? 200;
  const url = new URL(pathname, baseUrl);
  const started = Date.now();

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'KISS-Production-Monitor/1.0' },
      signal: AbortSignal.timeout(timeoutMs)
    });
    const durationMs = Date.now() - started;
    const body = options.readBody === false ? '' : await response.text();
    const finalUrl = new URL(response.url);

    const item = {
      name,
      requestedUrl: url.href,
      finalUrl: response.url,
      status: response.status,
      durationMs,
      contentType: response.headers.get('content-type') || ''
    };
    checks.push(item);

    if (response.status !== expectedStatus) {
      addFailure(name, `HTTP ${response.status}, erwartet ${expectedStatus}.`, item);
    }
    if (finalUrl.protocol !== 'https:') {
      addFailure(name, `Finale URL ist nicht HTTPS: ${response.url}`, item);
    }
    if (finalUrl.hostname !== baseUrl.hostname) {
      addFailure(name, `Finaler Host ${finalUrl.hostname} weicht vom Canonical-Host ${baseUrl.hostname} ab.`, item);
    }
    if (durationMs > slowWarningMs) {
      addWarning(name, `Antwortzeit ${durationMs} ms > ${slowWarningMs} ms.`, item);
    }

    if (options.validate) {
      await options.validate({ response, body, item });
    }
  } catch (error) {
    addFailure(name, `Request fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`, {
      requestedUrl: url.href
    });
  }
}

function checkCertificate() {
  return new Promise((resolve) => {
    const host = baseUrl.hostname;
    const socket = tls.connect({
      host,
      port: Number(baseUrl.port || 443),
      servername: host,
      rejectUnauthorized: true,
      timeout: timeoutMs
    });

    const finish = (result) => {
      socket.destroy();
      resolve(result);
    };

    socket.once('secureConnect', () => {
      const cert = socket.getPeerCertificate();
      const validTo = cert?.valid_to ? new Date(cert.valid_to) : null;
      if (!validTo || Number.isNaN(validTo.getTime())) {
        addFailure('TLS certificate', 'Ablaufdatum des TLS-Zertifikats konnte nicht gelesen werden.');
        finish();
        return;
      }

      const remainingMs = validTo.getTime() - Date.now();
      const remainingDays = remainingMs / 86_400_000;
      checks.push({
        name: 'TLS certificate',
        host,
        validTo: validTo.toISOString(),
        remainingDays: Math.floor(remainingDays)
      });

      if (remainingDays < minCertificateDays) {
        addFailure('TLS certificate', `Zertifikat läuft in ${Math.floor(remainingDays)} Tagen ab; Minimum ${minCertificateDays}.`);
      }
      finish();
    });

    socket.once('timeout', () => {
      addFailure('TLS certificate', `TLS-Prüfung nach ${timeoutMs} ms abgebrochen.`);
      finish();
    });

    socket.once('error', (error) => {
      addFailure('TLS certificate', `TLS-Verbindung fehlgeschlagen: ${error.message}`);
      finish();
    });
  });
}

await requestCheck('Startseite', '/', {
  validate: ({ body, item }) => {
    if (/<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(body)) {
      addFailure('Startseite', 'Produktionsseite enthält noindex.', item);
    }
    if (!/<link\s+rel=["']canonical["'][^>]*href=["']https:\/\/www\.wunschausbau\.de\//i.test(body)) {
      addFailure('Startseite', 'Canonical auf https://www.wunschausbau.de/ fehlt.', item);
    }
    if (!/application\/ld\+json/i.test(body)) {
      addFailure('Startseite', 'JSON-LD Structured Data fehlt.', item);
    }
  }
});

await requestCheck('Leistungen', '/leistungen/');
await requestCheck('Kontakt', '/kontakt/');
await requestCheck('robots.txt', '/robots.txt', {
  validate: ({ body, item }) => {
    if (/^\s*Disallow:\s*\/\s*$/im.test(body)) {
      addFailure('robots.txt', 'robots.txt sperrt die gesamte Website.', item);
    }
    if (!/Sitemap:\s*https:\/\/www\.wunschausbau\.de\/sitemap-index\.xml/i.test(body)) {
      addFailure('robots.txt', 'Canonical-Sitemap-Hinweis fehlt oder zeigt auf einen anderen Host.', item);
    }
  }
});
await requestCheck('Sitemap', '/sitemap-index.xml', {
  validate: ({ body, item }) => {
    if (!/https:\/\/www\.wunschausbau\.de\//i.test(body)) {
      addFailure('Sitemap', 'Canonical-Produktionsdomain fehlt in der Sitemap.', item);
    }
    if (/https:\/\/wunschausbau\.de\//i.test(body)) {
      addFailure('Sitemap', 'Apex-URLs statt Canonical-www-URLs in der Sitemap gefunden.', item);
    }
  }
});
await requestCheck('Formular-Funktion', '/api/anfrage', {
  expectedStatus: 405,
  validate: ({ response, item }) => {
    if (!/text\/plain/i.test(response.headers.get('content-type') || '')) {
      addWarning('Formular-Funktion', 'GET /api/anfrage liefert einen unerwarteten Content-Type.', item);
    }
  }
});
await checkCertificate();

fs.mkdirSync(outDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: baseUrl.href,
  timeoutMs,
  slowWarningMs,
  minCertificateDays,
  checks,
  failures,
  warnings
};
fs.writeFileSync(path.join(outDir, 'production-monitor.json'), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(
  path.join(outDir, 'production-monitor.md'),
  [
    '# Production Monitoring',
    '',
    `- Ziel: ${baseUrl.href}`,
    `- Checks: ${checks.length}`,
    `- Fehler: ${failures.length}`,
    `- Hinweise: ${warnings.length}`,
    '',
    ...(failures.length ? ['## Fehler', ...failures.map((failure) => `- **${failure.name}:** ${failure.message}`), ''] : []),
    ...(warnings.length ? ['## Hinweise', ...warnings.map((warning) => `- **${warning.name}:** ${warning.message}`), ''] : [])
  ].join('\n')
);

if (warnings.length) warnings.forEach((warning) => console.warn(`WARN ${warning.name}: ${warning.message}`));
if (failures.length) {
  failures.forEach((failure) => console.error(`ERROR ${failure.name}: ${failure.message}`));
  process.exit(1);
}

console.log(`Production Monitoring bestanden: ${checks.length} Checks, ${warnings.length} Hinweise.`);
