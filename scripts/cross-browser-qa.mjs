import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

const baseUrl = (process.env.QA_BASE_URL || 'http://127.0.0.1:4321/wunschausbau_2').replace(/\/+$/, '');
const outDir = path.resolve('qa-artifacts', 'cross-browser');
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const androidUa = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

const profiles = [
  {
    key: 'firefox-desktop',
    engine: 'Firefox/Gecko',
    launch: firefox,
    context: { viewport: { width: 1366, height: 768 }, locale: 'de-DE', colorScheme: 'light', reducedMotion: 'no-preference' }
  },
  {
    key: 'webkit-desktop',
    engine: 'WebKit/Safari engine',
    launch: webkit,
    context: { viewport: { width: 1440, height: 900 }, locale: 'de-DE', colorScheme: 'light', reducedMotion: 'no-preference' }
  },
  {
    key: 'android-360',
    engine: 'Chromium/Android emulation',
    launch: chromium,
    context: {
      viewport: { width: 360, height: 800 },
      screen: { width: 360, height: 800 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: androidUa,
      locale: 'de-DE',
      colorScheme: 'light',
      reducedMotion: 'no-preference'
    }
  },
  {
    key: 'android-412',
    engine: 'Chromium/Android emulation',
    launch: chromium,
    context: {
      viewport: { width: 412, height: 915 },
      screen: { width: 412, height: 915 },
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
      userAgent: androidUa,
      locale: 'en-US',
      colorScheme: 'light',
      reducedMotion: 'no-preference'
    }
  }
];

const routes = [
  { key: 'de-home', path: '/', lang: 'de' },
  { key: 'de-services', path: '/leistungen/', lang: 'de' },
  { key: 'de-service-detail', path: '/leistungen/boeden/', lang: 'de' },
  { key: 'de-references', path: '/referenzen/', lang: 'de' },
  { key: 'de-contact', path: '/kontakt/', lang: 'de' },
  { key: 'de-404', path: '/404/', lang: 'de' },
  { key: 'en-home', path: '/en/', lang: 'en' },
  { key: 'en-services', path: '/en/services/', lang: 'en' },
  { key: 'en-service-detail', path: '/en/services/flooring/', lang: 'en' },
  { key: 'en-references', path: '/en/references/', lang: 'en' },
  { key: 'en-contact', path: '/en/contact/', lang: 'en' },
  { key: 'en-404', path: '/en/404/', lang: 'en' }
];

const failures = [];
const results = [];
const browsers = new Map();

function fail(profile, route, kind, message, meta = {}) {
  failures.push({ profile: profile.key, engine: profile.engine, route: route.key, kind, message, ...meta });
}

async function getBrowser(profile) {
  if (!browsers.has(profile.key)) browsers.set(profile.key, await profile.launch.launch({ headless: true }));
  return browsers.get(profile.key);
}

async function settle(page) {
  await page.evaluate(() => {
    for (const img of document.images) img.loading = 'eager';
  });
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
          new Promise((resolve) => setTimeout(resolve, 2_500))
        ]);
      }
      try { await img.decode?.(); } catch {}
    }));
  });
}

try {
  for (const profile of profiles) {
    const browser = await getBrowser(profile);

    for (const route of routes) {
      const started = Date.now();
      const context = await browser.newContext(profile.context);
      const page = await context.newPage();
      page.setDefaultTimeout(6_000);
      page.setDefaultNavigationTimeout(20_000);

      const browserErrors = [];
      const badResponses = [];
      let crashed = false;
      page.on('crash', () => { crashed = true; });
      page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`);
      });
      page.on('response', (response) => {
        try {
          const current = new URL(response.url());
          const expected = new URL(`${baseUrl}${route.path}`);
          if (current.origin === expected.origin && response.status() >= 400) badResponses.push(`${response.status()} ${current.pathname}`);
        } catch {}
      });

      try {
        const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded' });
        if (!response || response.status() >= 400) {
          fail(profile, route, 'navigation', `Route konnte nicht sauber geladen werden (HTTP ${response?.status() ?? 'n/a'}).`);
        }

        await settle(page);

        const state = await page.evaluate(() => {
          const root = document.documentElement;
          const viewportWidth = root.clientWidth;
          const scrollWidth = Math.max(root.scrollWidth, document.body.scrollWidth);
          const brokenImages = [...document.images]
            .filter((img) => img.complete && img.naturalWidth === 0)
            .map((img) => img.currentSrc || img.src || img.alt || '<image>');
          const visibleInteractive = [...document.querySelectorAll('a[href], button, input, select, textarea, summary')]
            .filter((element) => {
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
            });
          const clipped = visibleInteractive
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.left < -2 || rect.right > viewportWidth + 2;
            })
            .slice(0, 8)
            .map((element) => (element.textContent || element.getAttribute('aria-label') || element.tagName).trim().slice(0, 60));
          const tinyTouchTargets = visibleInteractive
            .filter((element) => {
              if (!matchMedia('(pointer: coarse)').matches) return false;
              const rect = element.getBoundingClientRect();
              const important = element.matches('button, input, select, textarea, .btn, .ks-button, .menu-btn, .mobile-cta a, .nav-cta');
              return important && (rect.width < 24 || rect.height < 24);
            })
            .slice(0, 8)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return { text: (element.textContent || element.getAttribute('aria-label') || element.tagName).trim().slice(0, 50), width: Math.round(rect.width), height: Math.round(rect.height) };
            });

          return {
            lang: root.lang,
            h1Count: document.querySelectorAll('h1').length,
            viewportWidth,
            scrollWidth,
            brokenImages,
            clipped,
            tinyTouchTargets,
            title: document.title
          };
        });

        if (state.lang !== route.lang) fail(profile, route, 'language', `html[lang] ist ${state.lang || '<leer>'}, erwartet ${route.lang}.`);
        if (state.h1Count !== 1) fail(profile, route, 'structure', `Erwartet genau ein H1, gefunden ${state.h1Count}.`);
        if (state.scrollWidth > state.viewportWidth + 2) fail(profile, route, 'overflow', `Horizontaler Overflow: ${state.scrollWidth - state.viewportWidth}px.`);
        if (state.brokenImages.length) fail(profile, route, 'images', 'Defekte Bilder erkannt.', { images: state.brokenImages });
        if (state.clipped.length) fail(profile, route, 'clipping', 'Interaktive Elemente ragen horizontal aus dem Viewport.', { elements: state.clipped });
        if (state.tinyTouchTargets.length) fail(profile, route, 'touch-target', 'Wichtige Touch-Ziele sind kleiner als 24×24 CSS-Pixel.', { targets: state.tinyTouchTargets });
        if (!state.title.trim()) fail(profile, route, 'title', 'Dokumenttitel fehlt.');

        const isAndroid = profile.key.startsWith('android-');
        if (isAndroid && route.key.endsWith('home')) {
          const menu = page.locator('.menu-btn');
          if (!(await menu.count()) || !(await menu.isVisible())) {
            fail(profile, route, 'mobile-menu', 'Mobile Menü-Schaltfläche fehlt.');
          } else {
            await menu.click();
            await page.waitForTimeout(100);
            const opened = await page.evaluate(() => ({
              expanded: document.querySelector('.menu-btn')?.getAttribute('aria-expanded'),
              navOpen: document.querySelector('#site-nav')?.classList.contains('open'),
              bodyLocked: document.body.classList.contains('nav-open')
            }));
            if (opened.expanded !== 'true' || !opened.navOpen || !opened.bodyLocked) {
              fail(profile, route, 'mobile-menu', 'Mobiles Menü öffnet nicht vollständig.', opened);
            }
            await menu.click();
            await page.waitForTimeout(80);
            const closed = await page.evaluate(() => ({
              expanded: document.querySelector('.menu-btn')?.getAttribute('aria-expanded'),
              navOpen: document.querySelector('#site-nav')?.classList.contains('open'),
              bodyLocked: document.body.classList.contains('nav-open')
            }));
            if (closed.expanded !== 'false' || closed.navOpen || closed.bodyLocked) {
              fail(profile, route, 'mobile-menu-close', 'Mobiles Menü schließt nicht vollständig.', closed);
            }
          }
        }

        if (route.key.endsWith('contact')) {
          const formState = await page.evaluate(() => ({
            form: Boolean(document.querySelector('form')),
            submit: Boolean(document.querySelector('form button[type="submit"], form input[type="submit"]')),
            labels: document.querySelectorAll('form label').length
          }));
          if (!formState.form || !formState.submit || formState.labels === 0) {
            fail(profile, route, 'form', 'Kontaktformular ist strukturell nicht vollständig.', formState);
          }
        }

        if (browserErrors.length) fail(profile, route, 'browser', 'JavaScript-/Konsolenfehler erkannt.', { errors: [...new Set(browserErrors)] });
        if (badResponses.length) fail(profile, route, 'network', 'Fehlerhafte lokale Responses erkannt.', { responses: [...new Set(badResponses)] });
        if (crashed) fail(profile, route, 'crash', 'Browserseite ist abgestürzt.');

        const caseFailures = failures.filter((item) => item.profile === profile.key && item.route === route.key);
        if (caseFailures.length) {
          await page.screenshot({ path: path.join(outDir, `${profile.key}-${route.key}-failure.png`), fullPage: true, animations: 'disabled' }).catch(() => {});
        }

        results.push({ profile: profile.key, engine: profile.engine, route: route.key, durationMs: Date.now() - started, errors: caseFailures.length });
      } catch (error) {
        fail(profile, route, 'exception', String(error));
        results.push({ profile: profile.key, engine: profile.engine, route: route.key, durationMs: Date.now() - started, errors: 1 });
      } finally {
        await context.close();
      }
    }
  }
} finally {
  for (const browser of browsers.values()) await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  profiles: profiles.map(({ key, engine }) => ({ key, engine })),
  routes: routes.map(({ key, path, lang }) => ({ key, path, lang })),
  cases: results,
  failures
};
await fs.writeFile(path.join(outDir, 'cross-browser-qa.json'), `${JSON.stringify(report, null, 2)}\n`);

const lines = [
  '# Cross-Browser & Android QA',
  '',
  `- Browser-/Device-Profile: **${profiles.length}**`,
  `- Routen: **${routes.length}**`,
  `- Testfälle: **${results.length}**`,
  `- Fehler: **${failures.length}**`,
  '- Engines: Firefox/Gecko, WebKit/Safari-Engine, Chromium mit Android-/Touch-Emulation',
  '- Sprachen: DE + EN inklusive 404, Kontakt und Leistungsdetail',
  '',
  failures.length ? '## Fehler' : '## Ergebnis',
  ''
];
if (failures.length) {
  for (const item of failures) lines.push(`- **${item.profile} / ${item.route} / ${item.kind}:** ${item.message}`);
} else {
  lines.push('Alle Cross-Browser-, Android-, Sprach-, Layout-, Bild-, Formular-, Menü- und JavaScript-Gates bestanden.');
}
await fs.writeFile(path.join(outDir, 'cross-browser-qa.md'), `${lines.join('\n')}\n`);
console.log(lines.join('\n'));

if (failures.length) process.exit(1);
