/**
 * Entfernt nach dem Build unreferenzierte Original-Bilddateien aus dist/_astro.
 * Astro kopiert importierte Originale konservativ mit; referenziert werden aber
 * ausschliesslich die optimierten WebP-Varianten. Der Schritt prueft vor dem
 * Loeschen, dass keine HTML-/CSS-Datei die Datei referenziert.
 */
import { readdirSync, readFileSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist', import.meta.url));
const astroDir = join(dist, '_astro');

const collectFiles = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collectFiles(p, out);
    else if (/\.(html|css|js)$/.test(name)) out.push(p);
  }
  return out;
};

const haystack = collectFiles(dist).map((f) => readFileSync(f, 'utf8')).join('\n');
let entfernt = 0;
for (const name of readdirSync(astroDir)) {
  if (!/\.(png|jpg|jpeg)$/i.test(name)) continue;
  if (!haystack.includes(name)) { unlinkSync(join(astroDir, name)); entfernt++; }
}
console.log(`prune-originals: ${entfernt} unreferenzierte Originaldatei(en) entfernt.`);
