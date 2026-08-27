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
  ...(failures.length ? ['## Fehler', ...failures.map((item) => `- ${item}`), ''] : ['Alle Motion- und No-JS-Gates bestanden.', ''])
].join('\n');

await fs.writeFile(path.join(outDir, 'motion-qa.md'), report, 'utf8');
console.log(report);
if (failures.length) process.exit(1);
