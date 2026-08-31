import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = (process.env.QA_BASE_URL || 'http://127.0.0.1:4321/wunschausbau_2').replace(/\/+$/, '');
const outDir = path.resolve('qa-artifacts');
const shotDir = path.join(outDir, 'responsive-accessibility');

const cases = [
  { key: 'home-320', path: '/', viewport: { width: 320, height: 568 }, openMenu: true },
  { key: 'kontakt-320', path: '/kontakt/', viewport: { width: 320, height: 568 } },
  { key: 'home-360', path: '/', viewport: { width: 360, height: 800 }, openMenu: true },
  { key: 'leistungen-360', path: '/leistungen/', viewport: { width: 360, height: 800 } },
  { key: 'home-landscape-small', path: '/', viewport: { width: 740, height: 360 }, openMenu: true },
  { key: 'kontakt-landscape', path: '/kontakt/', viewport: { width: 844, height: 390 } },
  { key: 'home-text-200', path: '/', viewport: { width: 1280, height: 800 }, textScale: 2 },
  { key: 'kontakt-text-200', path: '/kontakt/', viewport: { width: 1280, height: 800 }, textScale: 2 }
];

const failures = [];
const results = [];
const browser = await chromium.launch({ headless: true });

await fs.mkdir(shotDir, { recursive: true });

const addFailure = (testCase, message, meta = {}) => failures.push({ case: testCase.key, message, ...meta });

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 6_000 }).catch(() => {});
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...document.images].map(async (img) => {
      if (!img.complete) {
        await Promise.race([
          new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }),
          new Promise((resolve) => setTimeout(resolve, 2_000))
        ]);
      }
      try { await img.decode?.(); } catch {}
    }));
  });
}

try {
  for (const testCase of cases) {
    const context = await browser.newContext({
      viewport: testCase.viewport,
      reducedMotion: 'reduce',
      colorScheme: 'light',
      locale: 'de-DE'
    });
    const page = await context.newPage();
    const browserErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));

    const response = await page.goto(`${baseUrl}${testCase.path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    if (!response || response.status() >= 400) {
      addFailure(testCase, `Navigation fehlgeschlagen: HTTP ${response?.status() ?? 'n/a'}`);
      await context.close();
      continue;
    }

    await settle(page);

    if (testCase.textScale) {
      await page.evaluate((factor) => {
        const base = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        document.documentElement.style.fontSize = `${base * factor}px`;
      }, testCase.textScale);
      await page.waitForTimeout(150);
    }

    if (testCase.openMenu) {
      const menuButton = page.locator('.menu-btn');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(80);
        const expanded = await menuButton.getAttribute('aria-expanded');
        if (expanded !== 'true') addFailure(testCase, 'Mobiles Menü wurde nicht zuverlässig geöffnet.');
      }
    }

    const metrics = await page.evaluate(() => {
      const root = document.documentElement;
      const viewportWidth = root.clientWidth;
      const scrollWidth = Math.max(root.scrollWidth, document.body.scrollWidth);
      const visibleInteractive = [...document.querySelectorAll('a[href], button, input, select, textarea, summary')]
        .filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none'
            && style.visibility !== 'hidden'
            && Number(style.opacity) !== 0
            && rect.width > 0
            && rect.height > 0;
        });

      const tinyTargets = visibleInteractive
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width < 24 || rect.height < 24;
        })
        .slice(0, 12)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            element: `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : ''}`,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: (element.textContent || '').trim().slice(0, 60)
          };
        });

      const cutOffInteractive = visibleInteractive
        .filter((element) => {
          if (element.closest('.hp')) return false;
          const rect = element.getBoundingClientRect();
          return rect.right > viewportWidth + 2 || rect.left < -2;
        })
        .slice(0, 12)
        .map((element) => ({
          element: `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : ''}`,
          text: (element.textContent || '').trim().slice(0, 60)
        }));

      return {
        viewportWidth,
        scrollWidth,
        overflow: scrollWidth > viewportWidth + 2,
        tinyTargets,
        cutOffInteractive
      };
    });

    if (metrics.overflow) {
      addFailure(testCase, `Horizontaler Overflow: ${metrics.scrollWidth}px bei ${metrics.viewportWidth}px Viewport.`);
    }
    if (metrics.tinyTargets.length) {
      addFailure(testCase, 'Interaktive Ziele unter 24×24 CSS-Pixel gefunden.', { targets: metrics.tinyTargets });
    }
    if (metrics.cutOffInteractive.length) {
      addFailure(testCase, 'Interaktive Elemente ragen aus dem Viewport.', { elements: metrics.cutOffInteractive });
    }
    if (browserErrors.length) {
      addFailure(testCase, 'Browser-/JavaScript-Fehler erkannt.', { errors: browserErrors });
    }

    await page.screenshot({
      path: path.join(shotDir, `${testCase.key}.png`),
      fullPage: true
    });

    results.push({
      key: testCase.key,
      path: testCase.path,
      viewport: testCase.viewport,
      textScale: testCase.textScale || 1,
      openMenu: Boolean(testCase.openMenu),
      ...metrics
    });

    await context.close();
  }
} finally {
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
    '- Abdeckung: 320 px, 360 px, Mobile Landscape, 200 % Textskalierung, Touch-Target-Minimum 24×24',
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
