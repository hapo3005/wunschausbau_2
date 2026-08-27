import fs from 'node:fs/promises';
import path from 'node:path';
import { webkit, devices } from 'playwright';

const baseUrl = (process.env.QA_BASE_URL || 'http://127.0.0.1:4321/wunschausbau_2').replace(/\/+$/, '');
const outDir = path.resolve('qa-artifacts', 'webkit');
const failures = [];
const results = [];

const profiles = [
  { key: 'iphone13', device: devices['iPhone 13'] },
  { key: 'iphonese', device: devices['iPhone SE'] }
];

const routes = [
  { key: 'home', path: '/' },
  { key: 'leistungen', path: '/leistungen/' },
  { key: 'referenzen', path: '/referenzen/' },
  { key: 'kontakt', path: '/kontakt/' }
];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const browser = await webkit.launch({ headless: true });

function fail(kind, message, meta = {}) {
  failures.push({ kind, message, ...meta });
}

async function settle(page) {
  await page.evaluate(() => {
    for (const img of document.images) img.loading = 'eager';
  });

  await page.waitForLoadState('networkidle', { timeout: 7_000 }).catch(() => {});

  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;

    const waitForImage = async (img) => {
      if (img.complete) {
        try { await img.decode?.(); } catch {}
        return;
      }

      await Promise.race([
        new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        }),
        new Promise((resolve) => setTimeout(resolve, 4_000))
      ]);

      try { await img.decode?.(); } catch {}
    };

    await Promise.all([...document.images].map(waitForImage));
  });

  await page.waitForTimeout(120);
}

try {
  for (const profile of profiles) {
    for (const route of routes) {
      const url = `${baseUrl}${route.path}`;
      const context = await browser.newContext({
        ...profile.device,
        locale: 'de-DE',
        colorScheme: 'light',
        reducedMotion: 'no-preference'
      });
      const page = await context.newPage();
      const browserErrors = [];
      const badResponses = [];
      let crashed = false;

      page.on('crash', () => { crashed = true; });
      page.on('pageerror', (error) => browserErrors.push(`pageerror: ${error.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') browserErrors.push(`console: ${msg.text()}`);
      });
      page.on('response', (response) => {
        try {
          const current = new URL(response.url());
          const target = new URL(url);
          if (current.origin === target.origin && response.status() >= 400) {
            badResponses.push(`${response.status()} ${current.pathname}`);
          }
        } catch {}
      });

      const started = Date.now();
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (!response || response.status() >= 400) {
        fail('navigation', `WebKit konnte ${url} nicht laden`, { profile: profile.key, route: route.key, status: response?.status() });
      }

      await settle(page);

      const initial = await page.evaluate(() => {
        const root = document.documentElement;
        const h1Count = document.querySelectorAll('h1').length;
        const hiddenReveal = [...document.querySelectorAll('.reveal')].filter((el) => {
          const style = getComputedStyle(el);
          return style.visibility === 'hidden' || Number(style.opacity) < 0.85;
        }).length;
        const brokenImages = [...document.images]
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.currentSrc || img.src || img.alt || '<image>');

        return {
          iosClass: root.classList.contains('ios-safari'),
          h1Count,
          viewportWidth: root.clientWidth,
          scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
          hiddenReveal,
          brokenImages
        };
      });

      if (!initial.iosClass) {
        fail('ios-detection', 'iPhone-Profil wurde nicht als iOS/Safari erkannt', { profile: profile.key, route: route.key });
      }
      if (initial.h1Count !== 1) {
        fail('structure', `Erwartet ein H1, gefunden ${initial.h1Count}`, { profile: profile.key, route: route.key });
      }
      if (initial.scrollWidth > initial.viewportWidth + 2) {
        fail('overflow', `Horizontaler Überlauf: ${initial.scrollWidth - initial.viewportWidth}px`, { profile: profile.key, route: route.key });
      }
      if (initial.hiddenReveal > 0) {
        fail('visibility', `${initial.hiddenReveal} Reveal-Elemente sind auf iPhone nicht vollständig sichtbar`, { profile: profile.key, route: route.key });
      }
      if (initial.brokenImages.length) {
        fail('images', `Defekte Bilder nach vollständigem Laden: ${initial.brokenImages.join(', ')}`, { profile: profile.key, route: route.key });
      }

      await page.screenshot({ path: path.join(outDir, `${route.key}-${profile.key}-top.png`), fullPage: false });

      const pageHeight = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
      const viewportHeight = profile.device.viewport?.height || 844;
      const maxScroll = Math.max(0, pageHeight - viewportHeight);
      const checkpoints = [0.2, 0.42, 0.64, 0.84, 1];

      for (const checkpoint of checkpoints) {
        const y = Math.round(maxScroll * checkpoint);
        await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
        await page.waitForTimeout(180);

        const state = await page.evaluate(() => {
          const root = document.documentElement;
          const header = document.querySelector('.site-header');
          const headerRect = header?.getBoundingClientRect();
          const hiddenReveal = [...document.querySelectorAll('.reveal')].filter((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > innerHeight) return false;
            const style = getComputedStyle(el);
            return style.visibility === 'hidden' || Number(style.opacity) < 0.85;
          }).length;

          return {
            scrollWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
            viewportWidth: root.clientWidth,
            hiddenReveal,
            headerTop: headerRect?.top ?? null,
            headerBottom: headerRect?.bottom ?? null
          };
        });

        if (state.scrollWidth > state.viewportWidth + 2) {
          fail('overflow-scroll', `Horizontaler Überlauf beim Scrollen: ${state.scrollWidth - state.viewportWidth}px`, { profile: profile.key, route: route.key, checkpoint });
        }
        if (state.hiddenReveal > 0) {
          fail('visibility-scroll', `${state.hiddenReveal} sichtbare Elemente hängen in einem transparenten Zustand`, { profile: profile.key, route: route.key, checkpoint });
        }
        if (state.headerTop !== null && (state.headerTop < -2 || state.headerBottom <= 0)) {
          fail('sticky-header', 'Sticky Header ist beim iPhone-Scrollen aus dem sichtbaren Bereich geraten', { profile: profile.key, route: route.key, checkpoint, headerTop: state.headerTop });
        }
      }

      if (route.key === 'home') {
        await page.evaluate(() => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * 0.54)));
        await page.waitForTimeout(220);
        await page.screenshot({ path: path.join(outDir, `${route.key}-${profile.key}-middle.png`), fullPage: false });

        const proof = await page.evaluate(() => {
          const quote = document.querySelector('.proof-quote blockquote');
          const score = document.querySelector('.proof-score__rating');
          const quoteStyle = quote ? getComputedStyle(quote) : null;
          const scoreStyle = score ? getComputedStyle(score) : null;
          return {
            quoteVisible: !quoteStyle || (quoteStyle.visibility !== 'hidden' && Number(quoteStyle.opacity) >= 0.85),
            scoreVisible: !scoreStyle || (scoreStyle.visibility !== 'hidden' && Number(scoreStyle.opacity) >= 0.85)
          };
        });
        if (!proof.quoteVisible || !proof.scoreVisible) {
          fail('testimonial-motion', 'Bewertungsbereich ist auf iPhone nicht stabil sichtbar', { profile: profile.key, route: route.key, ...proof });
        }

        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(100);
        const menu = page.locator('.menu-btn');
        if (await menu.count()) {
          await menu.click();
          await page.waitForTimeout(120);
          const navVisible = await page.locator('#site-nav').isVisible();
          if (!navVisible) fail('mobile-menu', 'Mobiles Menü ist in WebKit nicht sichtbar', { profile: profile.key });
          await page.screenshot({ path: path.join(outDir, `${route.key}-${profile.key}-menu.png`), fullPage: false });
          await menu.click();
        }
      }

      if (browserErrors.length) {
        fail('browser', 'WebKit Browser-/Konsolenfehler erkannt', { profile: profile.key, route: route.key, errors: [...new Set(browserErrors)] });
      }
      if (badResponses.length) {
        fail('network', 'Fehlerhafte lokale Responses in WebKit erkannt', { profile: profile.key, route: route.key, responses: [...new Set(badResponses)] });
      }
      if (crashed) {
        fail('crash', 'WebKit-Seite ist während des Tests abgestürzt', { profile: profile.key, route: route.key });
      }

      results.push({
        profile: profile.key,
        route: route.key,
        durationMs: Date.now() - started,
        crashed,
        browserErrors: browserErrors.length,
        badResponses: badResponses.length
      });

      await context.close();
    }
  }
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  engine: 'Playwright WebKit',
  profiles: profiles.map((profile) => profile.key),
  routes: routes.map((route) => route.key),
  failures,
  results
};

await fs.writeFile(path.join(outDir, 'webkit-qa.json'), JSON.stringify(report, null, 2));

const lines = [
  '# WebKit / iPhone QA',
  '',
  `- Profile: **${profiles.length}**`,
  `- Seiten: **${routes.length}**`,
  `- Testfälle: **${results.length}**`,
  `- Fehler: **${failures.length}**`,
  '',
  failures.length ? '## Fehler' : '## Ergebnis',
  ''
];

if (failures.length) {
  for (const entry of failures) lines.push(`- **${entry.kind}** – ${entry.message} (${entry.profile || '-'} / ${entry.route || '-'})`);
} else {
  lines.push('WebKit blieb stabil: kein Crash, kein horizontaler Überlauf, keine unsichtbaren Inhalte, keine defekten Bilder und keine Browser-/Netzwerkfehler in den getesteten iPhone-Profilen.');
}

await fs.writeFile(path.join(outDir, 'webkit-qa.md'), `${lines.join('\n')}\n`);

if (failures.length) {
  console.error(`WebKit QA fehlgeschlagen: ${failures.length} Problem(e).`);
  process.exit(1);
}

console.log(`WebKit QA bestanden: ${results.length} iPhone-Testfälle ohne Fehler.`);
