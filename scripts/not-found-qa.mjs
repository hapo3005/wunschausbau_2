import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = (process.env.QA_BASE_URL || 'http://127.0.0.1:4321/wunschausbau_2').replace(/\/+$/, '');
const outDir = path.resolve('qa-artifacts', 'not-found');
await fs.mkdir(outDir, { recursive: true });

const routes = [
  { key: 'de-404', path: '/404/', lang: 'de', headline: 'aus dem Lot geraten' },
  { key: 'en-404', path: '/en/404/', lang: 'en', headline: 'slightly out of line' }
];

const profiles = [
  { key: 'mobile390', viewport: { width: 390, height: 844 } },
  { key: 'mobile430', viewport: { width: 430, height: 932 } },
  { key: 'desktop1440', viewport: { width: 1440, height: 1000 } }
];

const failures = [];
const cases = [];
const fail = (route, profile, kind, message, meta = {}) => failures.push({ route: route.key, profile: profile.key, kind, message, ...meta });

const browser = await chromium.launch({ headless: true });

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 7_000 }).catch(() => {});
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

function overlap(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

try {
  for (const route of routes) {
    for (const profile of profiles) {
      const context = await browser.newContext({
        viewport: profile.viewport,
        locale: route.lang === 'en' ? 'en-US' : 'de-DE',
        colorScheme: 'light',
        reducedMotion: 'no-preference'
      });
      const page = await context.newPage();
      const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      if (!response || response.status() >= 400) fail(route, profile, 'navigation', `HTTP ${response?.status() || 0}`);
      await settle(page);

      // Freeze the phase of infinite decorative animations so geometry checks are deterministic.
      await page.addStyleTag({
        content: '.precision-rig,.logo-stage__logo,.logo-stage__glow{animation-play-state:paused!important}'
      });

      const state = await page.evaluate(() => {
        const rect = (selector) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const box = el.getBoundingClientRect();
          return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
        };
        const rects = (selectors) => selectors
          .map((selector) => ({ selector, box: rect(selector) }))
          .filter((entry) => entry.box && entry.box.width > 0 && entry.box.height > 0);

        const root = document.documentElement;
        const section = rect('.not-found');
        const kicker = rect('.not-found__kicker');
        const h1 = rect('.not-found h1');
        const rig = rect('.not-found__rig');
        const logo = document.querySelector('.logo-stage__logo');
        const motifRects = rects([
          '.logo-stage',
          '.precision-rig__vertical',
          '.precision-rig__horizontal',
          '.precision-rig__ticks',
          '.precision-rig__angle',
          '.precision-rig__bob'
        ]);
        const buttons = [...document.querySelectorAll('.not-found__actions .btn')].map((el) => {
          const box = el.getBoundingClientRect();
          return { top: box.top, right: box.right, bottom: box.bottom, left: box.left, width: box.width, height: box.height };
        });
        const brokenImages = [...document.images].filter((img) => img.complete && img.naturalWidth === 0).length;
        const viewportWidth = root.clientWidth;
        const scrollWidth = Math.max(root.scrollWidth, document.body.scrollWidth);
        return {
          lang: root.lang,
          text: document.body.innerText,
          h1Count: document.querySelectorAll('h1').length,
          section,
          kicker,
          h1,
          rig,
          motifRects,
          buttons,
          brokenImages,
          viewportWidth,
          scrollWidth,
          viewportHeight: window.innerHeight,
          logoAnimation: logo ? getComputedStyle(logo).animationName : '',
          rigAnimation: document.querySelector('.precision-rig') ? getComputedStyle(document.querySelector('.precision-rig')).animationName : '',
          hasPrecisionVertical: Boolean(document.querySelector('.precision-rig__vertical')),
          hasPlumbBob: Boolean(document.querySelector('.precision-rig__bob'))
        };
      });

      if (state.lang !== route.lang) fail(route, profile, 'language', `html[lang]=${state.lang}, erwartet ${route.lang}`);
      if (!state.text.toLowerCase().includes(route.headline.toLowerCase())) fail(route, profile, 'copy', '404-Leitidee fehlt im sichtbaren Text.');
      if (state.h1Count !== 1) fail(route, profile, 'structure', `Genau ein H1 erwartet, gefunden ${state.h1Count}.`);
      if (!state.section || !state.kicker || !state.h1 || !state.rig) fail(route, profile, 'structure', '404-Komposition ist unvollständig.');
      if (!state.hasPrecisionVertical || !state.hasPlumbBob) fail(route, profile, 'brand-concept', 'KS-Präzisions-/Lot-Motiv ist unvollständig.');
      if (state.brokenImages) fail(route, profile, 'images', 'Logo oder Bild konnte nicht geladen werden.');
      if (state.scrollWidth > state.viewportWidth + 2) fail(route, profile, 'overflow', `Horizontaler Overflow: ${state.scrollWidth - state.viewportWidth}px.`);
      if (!state.logoAnimation || state.logoAnimation === 'none') fail(route, profile, 'motion', 'Das KS-Sägeblatt ist im normalen Motion-Modus nicht animiert.');

      if (state.rig && (state.rig.bottom <= 0 || state.rig.top >= state.viewportHeight)) {
        fail(route, profile, 'first-viewport', 'KS-Präzisionsmotiv ist beim Laden nicht sichtbar.');
      }

      const visibleCollision = state.h1 && state.motifRects.some(({ box }) => overlap(state.h1, box));
      if (visibleCollision) {
        const collisions = state.motifRects.filter(({ box }) => overlap(state.h1, box)).map(({ selector }) => selector);
        fail(route, profile, 'composition', 'Ein sichtbarer Teil des KS-Präzisionsmotivs überlappt die Headline.', { collisions });
      }

      if (profile.key.startsWith('mobile') && state.section && state.kicker && state.h1 && state.rig) {
        const kickerOffset = state.kicker.top - state.section.top;
        const h1Offset = state.h1.top - state.section.top;
        const rigOffset = state.rig.top - state.section.top;
        if (kickerOffset > 72) fail(route, profile, 'spacing', `Zu viel toter Raum oben: Kicker startet erst bei ${Math.round(kickerOffset)}px.`);
        if (h1Offset > 205) fail(route, profile, 'spacing', `Headline startet zu tief: ${Math.round(h1Offset)}px.`);
        if (rigOffset > 54) fail(route, profile, 'spacing', `KS-Motiv startet zu tief: ${Math.round(rigOffset)}px.`);
        if (state.buttons.length !== 2) {
          fail(route, profile, 'cta', `Zwei CTAs erwartet, gefunden ${state.buttons.length}.`);
        } else {
          const [first, second] = state.buttons;
          const stacked = second.top >= first.bottom - 1 && Math.abs(first.left - second.left) <= 2;
          if (!stacked) fail(route, profile, 'cta', 'Mobile CTAs müssen sauber untereinander stehen.');
          if (first.width < state.viewportWidth * .78 || second.width < state.viewportWidth * .78) {
            fail(route, profile, 'cta', 'Mobile CTAs nutzen die verfügbare Breite nicht ausreichend.');
          }
        }
      }

      const screenshot = path.join(outDir, `${route.key}-${profile.key}.png`);
      await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
      cases.push({ route: route.key, profile: profile.key, screenshot: path.relative(process.cwd(), screenshot) });
      await context.close();
    }
  }

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'de-DE', reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(`${baseUrl}/404/`, { waitUntil: 'domcontentloaded' });
  await settle(reducedPage);
  const reducedAnimations = await reducedPage.evaluate(() => ({
    logo: getComputedStyle(document.querySelector('.logo-stage__logo')).animationName,
    rig: getComputedStyle(document.querySelector('.precision-rig')).animationName,
    glow: getComputedStyle(document.querySelector('.logo-stage__glow')).animationName
  }));
  if (Object.values(reducedAnimations).some((name) => name && name !== 'none')) {
    failures.push({ route: 'de-404', profile: 'mobile390-reduced-motion', kind: 'reduced-motion', message: 'Reduced Motion deaktiviert nicht alle 404-Animationen.', animations: reducedAnimations });
  }
  await reducedContext.close();
} finally {
  await browser.close();
}

const report = { generatedAt: new Date().toISOString(), baseUrl, cases, failures };
await fs.writeFile(path.join(outDir, 'not-found-qa.json'), `${JSON.stringify(report, null, 2)}\n`);

const summary = [
  '# Premium 404 QA',
  '',
  `- Render-Fälle: **${cases.length}**`,
  `- Fehler: **${failures.length}**`,
  '- Prüft: sichtbares KS-Präzisionsmotiv, First-Viewport-Komposition, Mobile-Abstände, CTA-Stack, Overflow, Animation und Reduced Motion.',
  '',
  failures.length ? '## Fehler' : '## Ergebnis',
  failures.length
    ? failures.map((item) => `- **${item.kind}**: ${item.message} (${item.route}/${item.profile})`).join('\n')
    : 'Die 404 erfüllt die definierten Premium- und Responsive-Gates.'
].join('\n');

await fs.writeFile(path.join(outDir, 'not-found-qa.md'), `${summary}\n`);
console.log(summary);

if (failures.length) process.exit(1);
