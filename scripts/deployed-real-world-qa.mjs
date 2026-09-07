import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

const baseUrl = (process.env.QA_BASE_URL || 'https://hapo3005.github.io/wunschausbau_2').replace(/\/+$/, '');
const outDir = path.resolve('qa-artifacts', 'deployed-real-world');
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const edgeUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0';
const samsungUa = 'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36';
const pixelUa = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const ipadUa = 'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

const profiles = [
  {
    key: 'windows-edge',
    label: 'Windows 11 · Edge/Chromium',
    launch: chromium,
    context: {
      viewport: { width: 1366, height: 768 },
      userAgent: edgeUa,
      locale: 'de-DE',
      colorScheme: 'light'
    }
  },
  {
    key: 'windows-firefox',
    label: 'Windows 11 · Firefox/Gecko',
    launch: firefox,
    context: {
      viewport: { width: 1366, height: 768 },
      locale: 'de-DE',
      colorScheme: 'light'
    }
  },
  {
    key: 'macos-safari',
    label: 'macOS · Safari/WebKit',
    launch: webkit,
    context: {
      viewport: { width: 1440, height: 900 },
      locale: 'de-DE',
      colorScheme: 'light'
    }
  },
  {
    key: 'ipad-safari',
    label: 'iPadOS · Safari/WebKit touch',
    launch: webkit,
    context: {
      viewport: { width: 820, height: 1180 },
      screen: { width: 820, height: 1180 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: ipadUa,
      locale: 'de-DE',
      colorScheme: 'light'
    }
  },
  {
    key: 'android-samsung-internet',
    label: 'Samsung Galaxy · Samsung Internet',
    launch: chromium,
    context: {
      viewport: { width: 360, height: 800 },
      screen: { width: 360, height: 800 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: samsungUa,
      locale: 'de-DE',
      colorScheme: 'light'
    }
  },
  {
    key: 'android-pixel-chrome',
    label: 'Google Pixel · Chrome/Chromium',
    launch: chromium,
    context: {
      viewport: { width: 412, height: 915 },
      screen: { width: 412, height: 915 },
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
      userAgent: pixelUa,
      locale: 'de-DE',
      colorScheme: 'light'
    }
  }
];

const routes = [
  { key: 'de-home', path: '/', lang: 'de', status: 200 },
  { key: 'de-service', path: '/leistungen/boeden/', lang: 'de', status: 200 },
  { key: 'de-contact', path: '/kontakt/', lang: 'de', status: 200, form: true },
  { key: 'en-home', path: '/en/', lang: 'en', status: 200 },
  { key: 'en-service', path: '/en/services/flooring/', lang: 'en', status: 200 },
  { key: 'en-contact', path: '/en/contact/', lang: 'en', status: 200, form: true },
  { key: 'real-404', path: '/__qa_this_route_must_not_exist__/', lang: 'de', status: 404, notFound: true }
];

const failures = [];
const cases = [];
const browsers = new Map();

function fail(profile, route, kind, message, meta = {}) {
  failures.push({ profile: profile.key, label: profile.label, route: route.key, kind, message, ...meta });
}

async function browserFor(profile) {
  if (!browsers.has(profile.key)) browsers.set(profile.key, await profile.launch.launch({ headless: true }));
  return browsers.get(profile.key);
}

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...document.images].map(async (img) => {
      if (!img.complete) {
        await Promise.race([
          new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }),
          new Promise((resolve) => setTimeout(resolve, 3_000))
        ]);
      }
      try { await img.decode?.(); } catch {}
    }));
  });
}

try {
  for (const profile of profiles) {
    const browser = await browserFor(profile);

    for (const route of routes) {
      const started = Date.now();
      const context = await browser.newContext({
        ...profile.context,
        locale: route.lang === 'en' ? 'en-US' : 'de-DE'
      });
      const page = await context.newPage();
      page.setDefaultTimeout(7_000);
      page.setDefaultNavigationTimeout(25_000);

      const pageErrors = [];
      const consoleErrors = [];
      let crashed = false;
      page.on('crash', () => { crashed = true; });
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });

      try {
        const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded' });
        const status = response?.status() ?? 0;
        if (status !== route.status) {
          fail(profile, route, 'http-status', `HTTP ${status} statt erwartet ${route.status}.`);
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
              if (element.closest('[aria-hidden="true"]')) return false;
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
            .map((element) => (element.textContent || element.getAttribute('aria-label') || element.tagName).trim().slice(0, 70));
          const text = document.body.innerText;
          return {
            lang: root.lang,
            title: document.title,
            h1Count: document.querySelectorAll('h1').length,
            viewportWidth,
            scrollWidth,
            brokenImages,
            clipped,
            text,
            form: Boolean(document.querySelector('form.anfrage')),
            submit: Boolean(document.querySelector('form.anfrage button[type="submit"]'))
          };
        });

        if (state.lang !== route.lang) fail(profile, route, 'language', `html[lang]=${state.lang || '<leer>'}, erwartet ${route.lang}.`);
        if (!state.title.trim()) fail(profile, route, 'title', 'Dokumenttitel fehlt.');
        if (state.h1Count !== 1) fail(profile, route, 'structure', `Genau ein H1 erwartet, gefunden ${state.h1Count}.`);
        if (state.scrollWidth > state.viewportWidth + 2) fail(profile, route, 'overflow', `Horizontaler Overflow: ${state.scrollWidth - state.viewportWidth}px.`);
        if (state.brokenImages.length) fail(profile, route, 'images', 'Defekte Bilder erkannt.', { images: state.brokenImages });
        if (state.clipped.length) fail(profile, route, 'clipping', 'Interaktive Elemente ragen aus dem Viewport.', { elements: state.clipped });
        if (route.form && (!state.form || !state.submit)) fail(profile, route, 'form', 'Kontaktformular oder Submit-Button fehlt.');
        if (route.notFound && !/Fehler 404|Diese Seite gibt es nicht|page not found/i.test(state.text)) {
          fail(profile, route, 'custom-404', 'Die echte fehlende URL liefert nicht erkennbar unsere benutzerdefinierte 404-Seite.');
        }

        const shouldHaveMobileMenu = Boolean(profile.context.isMobile) && profile.context.viewport.width < 900 && !route.notFound;
        if (shouldHaveMobileMenu && route.key.endsWith('home')) {
          const menu = page.locator('.menu-btn');
          if (!(await menu.count()) || !(await menu.isVisible())) {
            fail(profile, route, 'mobile-menu', 'Mobile Menü-Schaltfläche fehlt oder ist nicht sichtbar.');
          } else {
            await menu.click();
            await page.waitForTimeout(100);
            const opened = await page.evaluate(() => ({
              expanded: document.querySelector('.menu-btn')?.getAttribute('aria-expanded'),
              navOpen: document.querySelector('#site-nav')?.classList.contains('open'),
              bodyLocked: document.body.classList.contains('nav-open')
            }));
            if (opened.expanded !== 'true' || !opened.navOpen || !opened.bodyLocked) {
              fail(profile, route, 'mobile-menu-open', 'Mobiles Menü öffnet nicht vollständig.', opened);
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

        if (pageErrors.length) fail(profile, route, 'pageerror', 'JavaScript-Ausnahme erkannt.', { errors: [...new Set(pageErrors)] });
        if (consoleErrors.length) fail(profile, route, 'console', 'Browser-Konsole enthält Fehler.', { errors: [...new Set(consoleErrors)] });
        if (crashed) fail(profile, route, 'crash', 'Browserseite ist abgestürzt.');

        const caseFailures = failures.filter((item) => item.profile === profile.key && item.route === route.key);
        if (caseFailures.length) {
          await page.screenshot({ path: path.join(outDir, `${profile.key}-${route.key}-failure.png`), fullPage: true, animations: 'disabled' }).catch(() => {});
        }

        cases.push({ profile: profile.key, label: profile.label, route: route.key, status, durationMs: Date.now() - started, errors: caseFailures.length });
      } catch (error) {
        fail(profile, route, 'exception', String(error));
        cases.push({ profile: profile.key, label: profile.label, route: route.key, status: 0, durationMs: Date.now() - started, errors: 1 });
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
  baseUrl,
  profiles: profiles.map(({ key, label }) => ({ key, label })),
  routes,
  cases,
  failures
};
await fs.writeFile(path.join(outDir, 'deployed-real-world-qa.json'), `${JSON.stringify(report, null, 2)}\n`);

const lines = [
  '# Deployed Real-World Browser QA',
  '',
  `- Ziel: **${baseUrl}**`,
  `- Profile: **${profiles.length}**`,
  `- Routen je Profil: **${routes.length}**`,
  `- Testfälle: **${cases.length}**`,
  `- Fehler: **${failures.length}**`,
  '- Abdeckung: Windows Edge/Chromium, Windows Firefox/Gecko, macOS Safari/WebKit, iPadOS Safari/WebKit, Samsung Internet und Pixel Chrome',
  '- Zusätzlich: echte nicht existierende URL muss HTTP 404 plus unsere benutzerdefinierte 404-Seite liefern',
  '',
  failures.length ? '## Fehler' : '## Ergebnis',
  ''
];

if (failures.length) {
  for (const item of failures) lines.push(`- **${item.label} / ${item.route} / ${item.kind}:** ${item.message}`);
} else {
  lines.push('Alle Post-Deploy-Browser-, Layout-, Navigation-, Formular-, Bild-, JavaScript- und 404-Gates bestanden.');
}

await fs.writeFile(path.join(outDir, 'deployed-real-world-qa.md'), `${lines.join('\n')}\n`);
console.log(lines.join('\n'));

if (failures.length) process.exit(1);
