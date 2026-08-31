import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = (process.env.QA_BASE_URL || 'http://127.0.0.1:4321/wunschausbau_2').replace(/\/+$/, '');
const outDir = path.resolve('qa-artifacts');
const shotDir = path.join(outDir, 'responsive-accessibility');

const cases = [
  { key: 'home-320', path: '/', viewport: { width: 320, height: 568 }, openMenu: true },
  { key: 'kontakt-320', path: '/kontakt/', viewport: { width: 320, height: 568 }, service: 'boeden' },
  { key: 'home-360', path: '/', viewport: { width: 360, height: 740 } },
  { key: 'home-landscape', path: '/', viewport: { width: 740, height: 360 }, openMenu: true },
  { key: 'kontakt-landscape', path: '/kontakt/', viewport: { width: 844, height: 390 } },
  { key: 'home-text-200', path: '/', viewport: { width: 1280, height: 800 }, textScale: 2 },
  { key: 'kontakt-text-200', path: '/kontakt/', viewport: { width: 1280, height: 800 }, textScale: 2 }
];

const failures = [];
const results = [];
await fs.mkdir(shotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  reducedMotion: 'reduce',
  colorScheme: 'light',
  locale: 'de-DE'
});
const page = await context.newPage();
page.setDefaultTimeout(5_000);
page.setDefaultNavigationTimeout(10_000);

const addFailure = (testCase, message, meta = {}) => failures.push({ case: testCase.key, message, ...meta });

const inspectLayout = async () => page.evaluate(() => {
  const root = document.documentElement;
  const viewportWidth = root.clientWidth;
  const scrollWidth = Math.max(root.scrollWidth, document.body.scrollWidth);
  const visibleInteractive = [...document.querySelectorAll('a[href], button, input, select, textarea, summary')]
    .filter((element) => {
      if (element.closest('.hp')) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) !== 0
        && rect.width > 0
        && rect.height > 0;
    });

  const importantTargets = [...document.querySelectorAll(
    'button, input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, textarea, summary, .btn, .ks-button, .submit, .menu-btn, .choice span, .mobile-contact a'
  )].filter((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  });

  const tinyTargets = importantTargets
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width < 24 || rect.height < 24;
    })
    .slice(0, 10)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        element: element.tagName.toLowerCase(),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        text: (element.textContent || '').trim().slice(0, 50)
      };
    });

  const cutOffInteractive = visibleInteractive
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.right > viewportWidth + 2 || rect.left < -2;
    })
    .slice(0, 10)
    .map((element) => ({
      element: element.tagName.toLowerCase(),
      text: (element.textContent || '').trim().slice(0, 50)
    }));

  return {
    viewportWidth,
    scrollWidth,
    overflow: scrollWidth > viewportWidth + 2,
    tinyTargets,
    cutOffInteractive
  };
});

try {
  for (const testCase of cases) {
    const startedAt = Date.now();
    await page.setViewportSize(testCase.viewport);

    const browserErrors = [];
    const onConsole = (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    };
    const onPageError = (error) => browserErrors.push(error.message);
    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    const suffix = testCase.service ? `?leistung=${encodeURIComponent(testCase.service)}` : '';
    const response = await page.goto(`${baseUrl}${testCase.path}${suffix}`, {
      waitUntil: 'domcontentloaded',
      timeout: 10_000
    });

    if (!response || response.status() >= 400) {
      addFailure(testCase, `Navigation fehlgeschlagen: HTTP ${response?.status() ?? 'n/a'}`);
      continue;
    }

    await page.waitForTimeout(120);

    if (testCase.textScale) {
      await page.evaluate((factor) => {
        document.documentElement.style.fontSize = `${16 * factor}px`;
      }, testCase.textScale);
      await page.waitForTimeout(80);
    }

    if (testCase.openMenu) {
      const menuButton = page.locator('.menu-btn');
      if (await menuButton.count() && await menuButton.isVisible()) {
        await menuButton.click();
        const expanded = await menuButton.getAttribute('aria-expanded');
        const navVisible = await page.locator('#site-nav').isVisible();
        if (expanded !== 'true' || !navVisible) addFailure(testCase, 'Mobiles Menü öffnet nicht zuverlässig.');
      } else {
        addFailure(testCase, 'Mobile Menü-Schaltfläche fehlt im erwarteten Viewport.');
      }
    }

    if (testCase.service) {
      const selected = page.locator(`input[name="leistung"][data-service-slug="${testCase.service}"]`);
      if (!(await selected.count()) || !(await selected.isChecked())) {
        addFailure(testCase, `Leistung ${testCase.service} wurde aus der URL nicht vorausgewählt.`);
      }
    }

    const metrics = await inspectLayout();
    if (metrics.overflow) addFailure(testCase, `Horizontaler Overflow: ${metrics.scrollWidth}px bei ${metrics.viewportWidth}px.`);
    if (metrics.tinyTargets.length) addFailure(testCase, 'Wichtige Touch-Ziele unter 24×24 CSS-Pixel.', { targets: metrics.tinyTargets });
    if (metrics.cutOffInteractive.length) addFailure(testCase, 'Interaktive Elemente ragen aus dem Viewport.', { elements: metrics.cutOffInteractive });
    if (browserErrors.length) addFailure(testCase, 'Browser-/JavaScript-Fehler erkannt.', { errors: browserErrors });

    const caseFailures = failures.filter((failure) => failure.case === testCase.key);
    if (caseFailures.length) {
      await page.screenshot({ path: path.join(shotDir, `${testCase.key}-failure.png`), fullPage: false });
    }

    results.push({
      key: testCase.key,
      path: testCase.path,
      viewport: testCase.viewport,
      textScale: testCase.textScale || 1,
      service: testCase.service || null,
      durationMs: Date.now() - startedAt,
      ...metrics
    });

    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }
} finally {
  await context.close();
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  cases: results,
  failures
};

await fs.writeFile(path.join(outDir, 'responsive-accessibility-qa.json'), `${JSON.stringify(report, null, 2)}\n`);
await fs.writeFile(
  path.join(outDir, 'responsive-accessibility-qa.md'),
  [
    '# Responsive & Accessibility Stress QA',
    '',
    `- Prüffälle: ${results.length}`,
    `- Fehler: ${failures.length}`,
    `- Laufzeit: ${results.reduce((sum, item) => sum + item.durationMs, 0)} ms`,
    '- Abdeckung: 320 px, 360 px, Mobile Landscape, 200 % Textskalierung, wichtige Touch-Ziele, Service-Vorauswahl',
    '',
    ...(failures.length
      ? ['## Fehler', ...failures.map((failure) => `- **${failure.case}:** ${failure.message}`)]
      : ['Alle Stress-Prüfungen bestanden.'])
  ].join('\n')
);

if (failures.length) {
  failures.forEach((failure) => console.error(`ERROR ${failure.case}: ${failure.message}`));
  process.exit(1);
}

console.log(`Responsive/Accessibility Stress QA bestanden: ${results.length} Fälle.`);
