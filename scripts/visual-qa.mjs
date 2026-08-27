import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, request } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = (process.env.QA_BASE_URL || 'http://127.0.0.1:4321/wunschausbau_2').replace(/\/+$/, '');
const outDir = path.resolve('qa-artifacts');
const shotDir = path.join(outDir, 'screenshots');

const routes = [
  { key: 'home', path: '/' },
  { key: 'leistungen', path: '/leistungen/' },
  { key: 'referenzen', path: '/referenzen/' },
  { key: 'ueber-uns', path: '/ueber-uns/' },
  { key: 'kontakt', path: '/kontakt/' }
];

const viewports = {
  mobile390: { width: 390, height: 844 },
  mobile430: { width: 430, height: 932 },
  tablet768: { width: 768, height: 1024 },
  desktop1024: { width: 1024, height: 768 },
  desktop1440: { width: 1440, height: 1000 },
  wide1920: { width: 1920, height: 1080 }
};

const matrix = [];
for (const route of routes) {
  for (const viewportName of ['mobile390', 'tablet768', 'desktop1440']) {
    matrix.push({ route, viewportName, viewport: viewports[viewportName] });
  }
}
for (const viewportName of ['mobile430', 'desktop1024', 'wide1920']) {
  matrix.push({ route: routes[0], viewportName, viewport: viewports[viewportName] });
}

const failures = [];
const warnings = [];
const cases = [];
const internalLinks = new Set();

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(shotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

const addFailure = (kind, message, meta = {}) => failures.push({ kind, message, ...meta });
const addWarning = (kind, message, meta = {}) => warnings.push({ kind, message, ...meta });

try {
  for (const entry of matrix) {
    const { route, viewportName, viewport } = entry;
    const url = `${baseUrl}${route.path}`;
    const context = await browser.newContext({
      viewport,
      reducedMotion: 'reduce',
      colorScheme: 'light',
      locale: 'de-DE'
    });
    const page = await context.newPage();
    const browserErrors = [];
    const badResponses = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') browserErrors.push(`console: ${msg.text()}`);
    });
    page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));
    page.on('response', (response) => {
      try {
        const responseUrl = new URL(response.url());
        const target = new URL(url);
        if (responseUrl.origin === target.origin && response.status() >= 400) {
          badResponses.push(`${response.status()} ${responseUrl.pathname}`);
        }
      } catch {}
    });

    const started = Date.now();
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    if (!response || response.status() >= 400) {
      addFailure('navigation', `Seite nicht erreichbar: ${url}`, { route: route.key, viewport: viewportName, status: response?.status() });
    }

    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      const images = [...document.images];
      await Promise.all(images.map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          });
        }
        try { await img.decode?.(); } catch {}
      }));
    });

    const structure = await page.evaluate(() => {
      const root = document.documentElement;
      const vw = root.clientWidth;
      const docScrollWidth = Math.max(root.scrollWidth, document.body.scrollWidth);
      const hasOverflow = docScrollWidth > vw + 2;
      const h1Count = document.querySelectorAll('h1').length;
      const brokenImages = [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src || img.alt || '<image>');
      const overflow = hasOverflow
        ? [...document.body.querySelectorAll('*')]
          .filter((el) => {
            if (el.closest('.hp, [aria-hidden="true"]')) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return false;
            return r.right > vw + 2 || r.left < -2;
          })
          .slice(0, 12)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              element: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.classList.length ? `.${[...el.classList].slice(0, 3).join('.')}` : ''}`,
              left: Math.round(r.left),
              right: Math.round(r.right),
              width: Math.round(r.width),
              viewportWidth: vw
            };
          })
        : [];
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);
      return { h1Count, brokenImages, hasOverflow, docScrollWidth, viewportWidth: vw, overflow, links };
    });

    if (structure.h1Count !== 1) {
      addFailure('structure', `Erwartet genau ein H1, gefunden: ${structure.h1Count}`, { route: route.key, viewport: viewportName });
    }
    if (structure.brokenImages.length) {
      addFailure('images', `Defekte Bilder: ${structure.brokenImages.join(', ')}`, { route: route.key, viewport: viewportName });
    }
    if (structure.hasOverflow) {
      addFailure('overflow', `Dokument ist ${structure.docScrollWidth - structure.viewportWidth}px breiter als der Viewport`, {
        route: route.key,
        viewport: viewportName,
        elements: structure.overflow
      });
    }
    if (browserErrors.length) {
      addFailure('browser', 'Browser-/Konsolenfehler erkannt', { route: route.key, viewport: viewportName, errors: browserErrors });
    }
    if (badResponses.length) {
      addFailure('network', 'Fehlerhafte lokale Responses erkannt', { route: route.key, viewport: viewportName, responses: badResponses });
    }

    for (const href of structure.links) {
      try {
        const parsed = new URL(href);
        const base = new URL(baseUrl);
        if (parsed.origin === base.origin && parsed.pathname.startsWith(base.pathname)) {
          parsed.hash = '';
          internalLinks.add(parsed.href);
        }
      } catch {}
    }

    if (viewportName === 'mobile390' || viewportName === 'desktop1440') {
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const serious = axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
      if (serious.length) {
        addFailure('accessibility', 'Schwere Axe-Verstöße erkannt', {
          route: route.key,
          viewport: viewportName,
          violations: serious.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            targets: v.nodes.slice(0, 5).flatMap((n) => n.target)
          }))
        });
      }
      const moderate = axe.violations.filter((violation) => violation.impact === 'moderate');
      if (moderate.length) {
        addWarning('accessibility', 'Moderate Axe-Hinweise', {
          route: route.key,
          viewport: viewportName,
          violations: moderate.map((v) => v.id)
        });
      }
    }

    if (route.key === 'home' && viewportName === 'mobile390') {
      const menuButton = page.locator('.menu-btn');
      if (await menuButton.count()) {
        await menuButton.click();
        const expanded = await menuButton.getAttribute('aria-expanded');
        const navVisible = await page.locator('#site-nav').isVisible();
        if (expanded !== 'true' || !navVisible) {
          addFailure('interaction', 'Mobiles Menü öffnet nicht korrekt', { route: route.key, viewport: viewportName });
        }
        await page.screenshot({ path: path.join(shotDir, 'home-mobile390-menu-open.png'), fullPage: false });
        await page.keyboard.press('Escape');
        if ((await menuButton.getAttribute('aria-expanded')) !== 'false') {
          addFailure('interaction', 'Mobiles Menü schließt per Escape nicht korrekt', { route: route.key, viewport: viewportName });
        }
      } else {
        addFailure('interaction', 'Mobile Menü-Schaltfläche fehlt', { route: route.key, viewport: viewportName });
      }
    }

    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      window.scrollTo(0, 0);
    });

    const screenshotPath = path.join(shotDir, `${route.key}-${viewportName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });

    if (route.key === 'home' && ['mobile390', 'desktop1440'].includes(viewportName)) {
      for (const [name, selector] of [
        ['header', '.site-header'],
        ['hero', '.ks-hero'],
        ['cta', '.cta-section'],
        ['footer', '.site-footer']
      ]) {
        const locator = page.locator(selector).first();
        if (await locator.count()) {
          await locator.screenshot({ path: path.join(shotDir, `home-${viewportName}-${name}.png`), animations: 'disabled' });
        }
      }
    }

    cases.push({
      route: route.key,
      viewport: viewportName,
      width: viewport.width,
      height: viewport.height,
      durationMs: Date.now() - started,
      screenshot: path.relative(process.cwd(), screenshotPath)
    });

    await context.close();
  }

  const api = await request.newContext();
  for (const link of [...internalLinks].sort()) {
    try {
      const result = await api.get(link, { maxRedirects: 5, timeout: 15_000 });
      if (result.status() >= 400) {
        addFailure('links', `Interner Link liefert HTTP ${result.status()}: ${link}`);
      }
    } catch (error) {
      addFailure('links', `Interner Link konnte nicht geprüft werden: ${link}`, { error: String(error) });
    }
  }
  await api.dispose();
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  cases,
  internalLinksChecked: internalLinks.size,
  failures,
  warnings
};

await fs.writeFile(path.join(outDir, 'visual-qa.json'), `${JSON.stringify(report, null, 2)}\n`);

const summary = [
  '# Visual QA',
  '',
  `- Render-Fälle: **${cases.length}**`,
  `- Interne Links: **${internalLinks.size}**`,
  `- Fehler: **${failures.length}**`,
  `- Hinweise: **${warnings.length}**`,
  '',
  failures.length ? '## Fehler' : '## Ergebnis',
  failures.length ? failures.map((f) => `- **${f.kind}**: ${f.message}${f.route ? ` (${f.route}/${f.viewport || ''})` : ''}`).join('\n') : 'Alle visuellen und funktionalen Browser-Gates bestanden.',
  warnings.length ? `\n## Hinweise\n${warnings.map((w) => `- **${w.kind}**: ${w.message}${w.route ? ` (${w.route}/${w.viewport || ''})` : ''}`).join('\n')}` : ''
].filter(Boolean).join('\n');

await fs.writeFile(path.join(outDir, 'visual-qa.md'), `${summary}\n`);
console.log(summary);

if (failures.length) process.exit(1);
