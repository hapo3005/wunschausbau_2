/* ============================================================
   Basis: Reset, Typografie, Layout-Utilities, Komponentenbasis
   ============================================================ */
*, *::before, *::after { box-sizing: border-box; margin: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: var(--font-text);
  font-size: var(--text-base);
  line-height: var(--leading);
  color: var(--ink);
  background: var(--paper);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 560;
  line-height: 1.12;
  letter-spacing: -0.015em;
  text-wrap: balance;
}
h1 { font-size: clamp(2.4rem, 5.5vw, 4rem); }
h2 { font-size: clamp(1.8rem, 3.6vw, 2.6rem); }
h3 { font-size: clamp(1.25rem, 2vw, 1.5rem); }
h4 { font-size: var(--text-base); }

p, li { max-width: 68ch; }

a { color: inherit; text-decoration-thickness: 1px; text-underline-offset: 3px; }
a:hover { color: var(--brass-deep); }

img { max-width: 100%; height: auto; display: block; }

:focus-visible { outline: 3px solid var(--brass); outline-offset: 3px; }

::selection { background: var(--ink); color: var(--paper-inverse); }

.skip-link {
  position: absolute; left: -9999px; top: 0; z-index: 200;
  padding: .75rem 1.25rem; background: var(--ink); color: var(--paper-inverse);
}
.skip-link:focus { left: 0; }

/* Layout */
.wrap { max-width: var(--content-max); margin-inline: auto; padding-inline: var(--pad-inline); }
.section { padding-block: clamp(3.5rem, 8vw, 6.5rem); }
.section--sand { background: var(--sand); border-block: 1px solid var(--line); }
.section--dark { background: var(--ink); color: var(--paper-inverse); }

/* Eyebrow: kleine Zeile ueber Ueberschriften */
.eyebrow {
  display: flex; align-items: center; gap: .75rem;
  font-size: var(--text-sm); font-weight: 600; letter-spacing: .08em;
  text-transform: uppercase; color: var(--brass-deep);
  margin-bottom: var(--space-2);
}
.eyebrow::before { content: ""; width: 2.5rem; height: 1px; background: var(--brass); }
.section--dark .eyebrow { color: var(--brass); }

.lead { font-size: var(--text-lg); color: var(--ink-soft); margin-top: var(--space-2); }
.section--dark .lead { color: rgba(246, 244, 239, .75); }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .6rem;
  min-height: 3rem; padding: 0 1.5rem;
  font-weight: 600; font-size: var(--text-base); text-decoration: none;
  border: 1px solid var(--ink); border-radius: var(--radius);
  background: var(--ink); color: var(--paper-inverse);
  transition: background var(--dur) var(--ease), color var(--dur) var(--ease), border-color var(--dur) var(--ease);
  cursor: pointer;
}
.btn:hover { background: var(--brass-deep); border-color: var(--brass-deep); color: #fff; }
.btn--ghost { background: transparent; color: var(--ink); }
.btn--ghost:hover { background: var(--ink); color: var(--paper-inverse); }
.section--dark .btn { background: var(--paper-inverse); color: var(--ink); border-color: var(--paper-inverse); }
.section--dark .btn:hover { background: var(--brass); border-color: var(--brass); color: var(--ink); }

/* Linienraster-Karte (keine Schatten, harte Kanten) */
.tile {
  border: 1px solid var(--line); border-radius: var(--radius);
  background: var(--paper);
}

/* Reveal – einmalig, ruhig, respektiert reduced motion */
.reveal { opacity: 0; transform: translateY(16px); transition: opacity .5s var(--ease), transform .5s var(--ease); }
.reveal.is-visible { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { opacity: 1; transform: none; transition: none; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

/* Rechtsseiten */
.legal { max-width: 46rem; }
.legal h1 { margin-bottom: var(--space-4); }
.legal p { margin-bottom: var(--space-2); }
.platzhalter { color: var(--error); font-weight: 500; }
.warnbox { margin-top: var(--space-4); padding: var(--space-2) var(--space-3); border: 1px solid var(--error); border-radius: var(--radius); color: var(--error); font-size: var(--text-sm); }
