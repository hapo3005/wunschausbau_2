import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = (process.env.QA_BASE_URL || 'http://127.0.0.1:4321/wunschausbau_2').replace(/\/+$/, '');
const url = `${baseUrl}/`;
const outDir = path.resolve('qa-artifacts');
const failures = [];
const notes = [];

await fs.mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

const fail = (message) => failures.push(message);

try {
  // Real motion path: unlike the main visual matrix, this explicitly does NOT reduce motion.
  const motionContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'no-preference',
    colorScheme: 'light',
    locale: 'de-DE'
  });
  const page = await motionContext.newPage();
  const browserErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') browserErrors.push(msg.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  if (!response || response.status() >= 400) fail(`Motion-Seite nicht erreichbar (${response?.status() ?? 'keine Response'}).`);
  await page.waitForLoadState('networkidle', { timeout: 6_000 }).catch(() => {});
  await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });

  const revealCount = await page.locator('.reveal').count();
  for (let i = 0; i < revealCount; i += 1) {
    const target = page.locator('.reveal').nth(i);
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(720);
    const state = await target.evaluate((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        opacity: Number(style.opacity),
        visibility: style.visibility,
        display: style.display,
        width: rect.width,
        height: rect.height
      };
    });
    if (state.display === 'none' || state.visibility === 'hidden' || state.opacity < 0.92 || state.width === 0 || state.height === 0) {
      fail(`Reveal ${i + 1}/${revealCount} bleibt nach Scrollen unsichtbar (opacity ${state.opacity}).`);
    }
  }

  const proofStage = page.locator('[data-proof-stage]');
  if (await proofStage.count()) {
    await proofStage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1_050);
    const proofState = await page.evaluate(() => {
      const selectors = [
        '.proof-score__rating',
        '.proof-score__bottom',
        '.proof-quote__topline',
        '.proof-quote blockquote',
        '.proof-quote figcaption'
      ];
      return selectors.map((selector) => {
        const el = document.querySelector(selector);
        if (!el) return { selector, missing: true };
        const style = getComputedStyle(el);
        return { selector, opacity: Number(style.opacity), visibility: style.visibility };
      });
    });
    for (const item of proofState) {
      if (item.missing) fail(`Motion-QA: ${item.selector} fehlt.`);
      else if (item.visibility === 'hidden' || item.opacity < 0.92) fail(`Motion-QA: ${item.selector} bleibt zu transparent (opacity ${item.opacity}).`);
    }
  }

  if (browserErrors.length) fail(`Browserfehler im Motion-Pfad: ${browserErrors.join(' | ')}`);
  await motionContext.close();

  // Touch scroll regression path: expensive reveal animations must never run on
  // coarse-pointer devices, and scroll-linked UI may only mutate when its state changes.
  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'no-preference',
    colorScheme: 'light',
    locale: 'de-DE',
    userAgent: 'Mozilla/5.0 (Linux; Android 16; Mobile) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36'
  });
  const touchPage = await touchContext.newPage();

  await touchPage.addInitScript(() => {
    window.__revealAnimationCalls = 0;
    const originalAnimate = Element.prototype.animate;
    if (typeof originalAnimate === 'function') {
      Element.prototype.animate = function (...args) {
        if (this.classList?.contains('reveal')) window.__revealAnimationCalls += 1;
        return originalAnimate.apply(this, args);
      };
    }
  });

  const touchResponse = await touchPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  if (!touchResponse || touchResponse.status() >= 400) fail(`Touch-QA-Seite nicht erreichbar (${touchResponse?.status() ?? 'keine Response'}).`);
  await touchPage.waitForLoadState('networkidle', { timeout: 6_000 }).catch(() => {});
  await touchPage.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });

  const internalNavigation = await touchPage.evaluate(() => [...document.querySelectorAll('a[href]')]
    .filter((link) => link instanceof HTMLAnchorElement && link.target !== '_blank')
    .map((link) => {
      const href = link.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) return null;
      try {
        const targetUrl = new URL(href, window.location.href);
        if (targetUrl.origin !== window.location.origin) return null;
        return { href, target: link.target };
      } catch {
        return null;
      }
    })
    .filter(Boolean));
  const unsafeInternalNavigation = internalNavigation.filter((link) => link.target !== '_top');
  if (unsafeInternalNavigation.length) {
    fail(`Touch-QA: ${unsafeInternalNavigation.length} interne Links verlassen eingebettete Preview-Kontexte nicht per _top.`);
  } else {
    notes.push(`Touch-QA: ${internalNavigation.length} interne Links sind gegen eingebettete Preview-Navigation abgesichert.`);
  }

  await touchPage.evaluate(() => {
    window.__scrollMutationCount = 0;
    const observed = [document.querySelector('.site-header'), document.querySelector('.mobile-cta')].filter(Boolean);
    window.__scrollMutationObservers = observed.map((root) => {
      const observer = new MutationObserver((records) => {
        window.__scrollMutationCount += records.length;
      });
      observer.observe(root, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'aria-hidden', 'tabindex']
      });
      return observer;
    });
  });

  await touchPage.evaluate(async () => {
    const maxY = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const step = Math.max(120, Math.round(innerHeight * 0.42));
    for (let y = 0; y <= maxY; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }
    window.scrollTo(0, maxY);
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    window.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  });

  const touchState = await touchPage.evaluate(() => {
    window.__scrollMutationObservers?.forEach((observer) => observer.disconnect());
    const hidden = [...document.querySelectorAll('.reveal')]
      .map((el, index) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return { index, opacity: Number(style.opacity), visibility: style.visibility, display: style.display, width: rect.width, height: rect.height };
      })
      .filter((item) => item.display === 'none' || item.visibility === 'hidden' || item.opacity < 0.92 || item.width === 0 || item.height === 0);
    return {
      revealAnimationCalls: window.__revealAnimationCalls || 0,
      scrollMutationCount: window.__scrollMutationCount || 0,
      hiddenRevealCount: hidden.length
    };
  });

  if (touchState.revealAnimationCalls !== 0) {
    fail(`Touch-QA: ${touchState.revealAnimationCalls} Reveal-Web-Animationen wurden beim mobilen Scrollen gestartet.`);
  } else {
    notes.push('Touch-QA: keine Reveal-Web-Animationen während des mobilen Scrollens.');
  }

  if (touchState.scrollMutationCount > 14) {
    fail(`Touch-QA: ${touchState.scrollMutationCount} scrollgekoppelte DOM-Mutationen – Budget 14 überschritten.`);
  } else {
    notes.push(`Touch-QA: scrollgekoppelte DOM-Mutationen im Budget (${touchState.scrollMutationCount}/14).`);
  }

  if (touchState.hiddenRevealCount) {
    fail(`Touch-QA: ${touchState.hiddenRevealCount} Reveal-Bereiche sind nach dem Scrolltest nicht vollständig sichtbar.`);
  }
  await touchContext.close();

  // No-JS path: content must remain readable even if scripts fail or are blocked.
  const noJsContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    javaScriptEnabled: false,
    colorScheme: 'light',
    locale: 'de-DE'
  });
  const noJsPage = await noJsContext.newPage();
  const noJsResponse = await noJsPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  if (!noJsResponse || noJsResponse.status() >= 400) fail(`No-JS-Seite nicht erreichbar (${noJsResponse?.status() ?? 'keine Response'}).`);

  const hiddenWithoutJs = await noJsPage.evaluate(() => [...document.querySelectorAll('.reveal')]
    .map((el, index) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return { index, opacity: Number(style.opacity), visibility: style.visibility, display: style.display, width: rect.width, height: rect.height };
    })
    .filter((item) => item.display === 'none' || item.visibility === 'hidden' || item.opacity < 0.92 || item.width === 0 || item.height === 0));

  if (hiddenWithoutJs.length) fail(`Ohne JavaScript sind ${hiddenWithoutJs.length} Reveal-Bereiche nicht vollständig sichtbar.`);
  else notes.push('No-JS-Fallback: alle Reveal-Inhalte bleiben sichtbar.');
  await noJsContext.close();
} finally {
  await browser.close();
}

const report = [
  '# Motion & Resilience QA',
  '',
  `- Fehler: **${failures.length}**`,
  `- Hinweise: **${notes.length}**`,
  '',
  ...(notes.length ? ['## Hinweise', ...notes.map((item) => `- ${item}`), ''] : []),
  ...(failures.length ? ['## Fehler', ...failures.map((item) => `- ${item}`), ''] : ['Alle Motion-, Touch-Scroll- und No-JS-Gates bestanden.', ''])
].join('\n');

await fs.writeFile(path.join(outDir, 'motion-qa.md'), report, 'utf8');
console.log(report);
if (failures.length) process.exit(1);
