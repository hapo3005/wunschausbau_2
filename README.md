# wunschausbau.de – Relaunch

Hochwertiger, responsiver Relaunch für **KS – Innenausbau Kevin Schmieding**.
Die Website wird mit Astro statisch erzeugt, nutzt lokale Schriften, keine Tracker
und kein clientseitiges Framework.

## Enthalten

- responsive Startseite und Unterseiten
- sieben strukturierte Leistungsseiten
- Referenzen, Über uns, Kontakt und FAQ
- interne, nicht indexierte Freigabeseite für den Kevin-Termin
- barrierearme Navigation mit vollständigem Mobilmenü
- serverseitig abgesichertes Anfrageformular für Netlify
- lokale variable Schriften: Inter Tight, Manrope und Source Serif 4
- responsive WebP-Bilder über Astro
- Sitemap, robots.txt, Open-Graph-Daten und strukturierte Unternehmensdaten
- reduzierte Animationen bei `prefers-reduced-motion`
- 320-Pixel-Unterstützung ohne horizontales Scrollen

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Die Vorschau ist anschließend normalerweise unter
`http://localhost:4321` erreichbar.

## Produktions-Build

```bash
npm run build
npm run preview
```

Der fertige Stand liegt in `dist/`. Die HTML-Dateien sollten nicht direkt per
Doppelklick geöffnet werden, weil die Website absolute Pfade für Bilder und
Schriften verwendet.

## Hosting

**GitHub Pages dient nur als öffentliche Vorschau.** In GitHub Actions wird die
Seite deshalb mit dem Projekt-Basispfad `/wunschausbau_2/` gebaut.

Für die produktive Domain `wunschausbau.de` ist **Netlify** vorgesehen. Außerhalb
von GitHub Actions baut Astro automatisch für die Root-Domain (`base: /`). Das ist
außerdem erforderlich, weil das Anfrageformular eine Netlify Function unter
`/api/anfrage` nutzt und auf GitHub Pages nicht serverseitig ausgeführt werden kann.

Der vollständige Umschaltplan liegt in `DOMAIN_RELAUNCH_CUTOVER_PLAN.md`.

## Inhalte pflegen

- Leistungen: `src/content/leistungen/*.md`
- Kontaktdaten und Kennzahlen: `src/data/settings.json`
- Kundenstimmen: `src/data/kundenstimmen.json`
- FAQ: `src/data/faq.json`
- Bilder: `src/assets/`

## Formular auf Netlify

Die Funktion `netlify/functions/anfrage.mjs` verarbeitet das Formular unter
`/api/anfrage`. Vor dem produktiven Einsatz müssen die Werte aus `.env.example`
bei Netlify als Umgebungsvariablen hinterlegt werden:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_TO`
- `MAIL_FROM`

`.env`-Dateien und andere lokale Secret-Dateien sind in `.gitignore` ausgeschlossen;
`.env.example` enthält ausschließlich Platzhalter.

## Qualitätsprüfung

Der Relaunch wird über den GitHub-Pages-Workflow reproduzierbar gebaut. Zusätzlich
wurden responsive Layout, Navigation, Formularvalidierung, Bildpfade, Überschriften,
IDs und Browserdarstellung geprüft. Nach jeder wesentlichen Abhängigkeitsänderung
müssen `package.json` und `package-lock.json` synchron bleiben.

## Vorbereitung Kevin-Termin 28.08.2026

- `KEVIN_TERMIN_KURZCHECK_2026-08-28.md` – kompakter Termincheck
- `KEVIN_TERMIN_2026-08-28.md` – vollständiger Gesprächsleitfaden
- `GOOGLE_BUSINESS_PROFILE_READY_TO_PASTE.md` – operative GBP-Zielkonfiguration
- `GBP_LIVE_EDIT_RUNBOOK.md` – Reihenfolge der späteren Google-Änderungen
- `EXTERNAL_PRESENCE_MASTER.md` – Google, MyHammer, Instagram und weitere Profile
- `GOOGLE_MEASUREMENT_PLAN.md` – GBP-Performance und Search Console
- `DOMAIN_RELAUNCH_CUTOVER_PLAN.md` – Produktionsdomain / Netlify
- `/freigabe/` – interne, `noindex` gesetzte visuelle Freigabeseite

## Vor der Veröffentlichung zwingend

- Impressum, Datenschutz und gegebenenfalls AGB anwaltlich erstellen bzw. prüfen
- vollständige Geschäftsanschrift und Standortmodell bestätigen
- SMTP-Zugangsdaten konfigurieren und eine reale Testanfrage versenden
- Aussagen in Kennzahlen und Kundenstimmen vom Unternehmer bestätigen lassen
- echte, freigegebene Projektaufnahmen einsetzen
- finalen Leistungskatalog und Einsatzgebiet bestätigen
- aktuelle Social-Profile verifizieren

Die Rechtstext-Platzhalter bleiben bewusst bestehen, bis geprüfte Inhalte vom
Unternehmer oder einer entsprechend qualifizierten Stelle vorliegen.
