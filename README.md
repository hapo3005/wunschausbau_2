# wunschausbau.de – Relaunch

Premium-Relaunch der Webseite von **KS - Innenausbau Kevin Schmieding** (Marke: wunschausbau.de).
Statisch generierter Mehrseiter auf Basis von Astro, ohne Client-Framework, DSGVO-freundlich
(lokale Schriften, keine Cookies, keine Tracker, keine Dritt-CDNs).

## Technologie

- **Astro 5** – statischer Site-Generator, 0 kB Framework-JS im Frontend
- **@astrojs/sitemap** – erzeugt sitemap-index.xml automatisch
- **@fontsource** – Inter + Fraunces lokal gehostet (woff2, variable Fonts)
- **Nodemailer** – E-Mail-Versand in der Formular-Funktion (Serverless)
- Bildoptimierung: eingebaut (sharp) – erzeugt responsive WebP-Varianten

## Projektstruktur

```
relaunch/
├─ astro.config.mjs        Site-URL, Sitemap, Trailing Slash
├─ netlify.toml            Build, Security-Header, Caching
├─ netlify/functions/
│  └─ anfrage.mjs          Formular-Endpoint /api/anfrage (Validierung, Spam-Schutz, SMTP)
├─ scripts/
│  └─ prune-originals.mjs  entfernt unreferenzierte Original-Bilder aus dist/
├─ public/                 robots.txt, favicon.svg, og-image.jpg
└─ src/
   ├─ styles/tokens.css    ALLE Design-Tokens (Farben, Schrift, Abstände)
   ├─ styles/base.css      Reset, Typografie, Utilities, Buttons
   ├─ layouts/Base.astro   Head/Meta, Header, Footer, Reveal-Script
   ├─ components/          Header, Footer, ProcessSteps, Testimonials, CtaBand
   ├─ content/leistungen/  7 Leistungen als Markdown (Dateiname = URL-Slug)
   ├─ data/                settings.json, kundenstimmen.json, faq.json
   ├─ assets/              Bilder (werden beim Build optimiert)
   └─ pages/               index, leistungen/, referenzen, ueber-uns, kontakt,
                           danke, impressum, datenschutz, agb, 404
```

## Inhalte pflegen (bis das CMS kommt)

- **Leistungen**: `src/content/leistungen/*.md` – Frontmatter (Titel, Kurztext, Bild, SEO) + Fließtext
- **Kontaktdaten/Kennzahlen**: `src/data/settings.json`
- **Kundenstimmen**: `src/data/kundenstimmen.json`
- **FAQ**: `src/data/faq.json`
- Nach Änderungen: `npm run build` und `dist/` neu deployen

## Entwicklung

```bash
npm install        # einmalig
npm run dev        # Entwicklungsserver auf http://localhost:4321
npm run build      # Produktions-Build nach dist/
npm run preview    # gebauten Stand lokal ansehen
```

Hinweis: `dist/index.html` direkt per Doppelklick zu öffnen funktioniert nicht (absolute Pfade) –
immer `npm run preview` oder einen lokalen Server nutzen.

## Deployment (Netlify, empfohlen)

1. Repository zu GitHub/GitLab pushen, bei Netlify "Import from Git"
2. Build-Kommando und Publish-Verzeichnis kommen aus `netlify.toml`
3. Umgebungsvariablen setzen (Site settings → Environment): siehe `.env.example`
   (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO`, `MAIL_FROM`)
4. Domain wunschausbau.de verbinden (DNS beim Domain-Anbieter umstellen)

Die Formular-Funktion läuft ohne Anpassung auch auf anderen Plattformen mit
Web-Standard-Functions; bei reinem Shared Hosting muss `/api/anfrage` durch ein
kleines PHP-Script ersetzt werden (Feldnamen siehe `netlify/functions/anfrage.mjs`).

## Formular & Spam-Schutz

- Serverseitige Validierung aller Pflichtfelder und Längen
- Honeypot-Feld (`firma`) + Zeitfalle (Absenden < 3 s = Bot) – ohne Cookies/Captcha
- Versand per SMTP an MAIL_TO, Antwort-an = E-Mail des Anfragenden
- Datei-Upload bewusst zurückgestellt (Hinweis auf der Kontaktseite: Fotos per
  WhatsApp/E-Mail nach Erstkontakt) – kann in einer späteren Phase ergänzt werden

## Vor dem Launch zwingend erledigen

- [ ] **Rechtstexte ersetzen**: /impressum/, /datenschutz/, /agb/ enthalten rot markierte
      PLATZHALTER und sind nicht launchfähig (anwaltlich erstellen/prüfen lassen)
- [ ] Vollständige Anschrift für Impressum + LocalBusiness-Schema ergänzen
- [ ] SMTP-Zugangsdaten als Umgebungsvariablen setzen und Testanfrage senden
- [ ] Browser-/Gerätetest (Chrome, Firefox, Safari, Edge; Smartphone/Tablet/Desktop)
- [ ] Bei URL-Änderung von Alt-Ankern: Redirects prüfen (Altseite war One-Pager mit #-Ankern,
      diese benötigen keine Redirects)

## Bekannte Einschränkungen / nächste Phasen

- **Backend/CMS (Phase 4)**: noch nicht umgesetzt. Vorbereitet durch strukturierte
  Collections – Empfehlung: Git-basiertes CMS (z. B. Sveltia/Decap) oder gehostetes
  Headless-CMS an `src/content` + `src/data` anbinden
- **Referenzen**: zeigen aktuell die vorhandene (KI-generierte) Bildsprache; echte
  Projektfotos sind der wichtigste nächste Qualitätshebel (Austausch in
  `src/pages/referenzen.astro` bzw. später im CMS)
- Visueller Abschlusstest im echten Browser steht aus (Build- und Linkprüfung sind erfolgt)
