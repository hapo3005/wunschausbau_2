# KISS CI/CD Standard – wunschausbau.de

Stand: 31.08.2026

## Ziel

Änderungen sollen früh geprüft, reproduzierbar gebaut und kontrolliert veröffentlicht werden. Ein normaler Commit darf die Produktionsdomain niemals ungeprüft verändern.

## Pipeline

### 1. Pull Request – CI

Workflow: `.github/workflows/pr-quality.yml`

Vor dem Merge nach `main` laufen:

- `npm ci`
- Audit der Produktionsabhängigkeiten
- Astro-Preview-Build
- statischer HTML-/SEO-/Link-Gate
- Chromium Visual QA
- Motion-/No-JS-QA
- WebKit/iPhone-QA
- Lighthouse für Performance, Accessibility, Best Practices und SEO
- Dokumentation des aktuellen Release-Gates
- Upload der QA-Artefakte

Fehlschläge im Quality Gate bedeuten: nicht merge-fähig.

### 2. Main – geprüfte Vorschau

Workflow: `.github/workflows/deploy.yml`

Nach einem Push auf `main` wird derselbe Qualitätsanspruch erneut gegen den zusammengeführten Stand geprüft. Erst danach wird die GitHub-Pages-Vorschau veröffentlicht.

Die GitHub-Pages-Version bleibt eine Vorschau und wird nicht als Produktionshost verwendet.

### 3. Production – manuell freigegebene CD

Workflow: `.github/workflows/production-deploy.yml`

Ein Livegang ist ausschließlich per `workflow_dispatch` auf `main` vorgesehen. Er verlangt zusätzlich die Texteingabe `LIVE`.

Vor dem Netlify-Deploy müssen bestehen:

- Release Gate (`npm run qa:release`)
- expliziter manueller Produktionskontext
- Produktionsbuild mit Domain-/Root-Konfiguration für `wunschausbau.de`
- statischer Produktions-Gate
- Chromium Visual QA
- Motion-/No-JS-QA
- WebKit/iPhone-QA
- Lighthouse
- vorhandene Netlify-Zugangsdaten

Der Netlify-Deploy verwendet einen bereits geprüften Build (`--no-build`). Dadurch baut Netlify nicht stillschweigend einen anderen Stand als den zuvor geprüften Kandidaten.

Nach dem Deploy laufen Smoke Tests gegen Startseite, Leistungen, Kontakt und `robots.txt`.

## Doppelter Schutz vor unbeabsichtigtem Livegang

Der Produktionsbuild benötigt beide Variablen:

- `PRODUCTION_LAUNCH=true`
- `MANUAL_PRODUCTION_DEPLOY=true`

Das normale `netlify.toml` setzt für einen Netlify-Production-Kontext nur `PRODUCTION_LAUNCH=true`. Ein versehentlich aktiviertes Netlify-Git-Autopublishing kann damit den Produktions-Gate nicht passieren.

Empfehlung: Netlify-Autopublishing trotzdem deaktivieren und Produktion ausschließlich über den GitHub-Workflow veröffentlichen.

## Release Gate

Der Livegang bleibt blockiert, solange mindestens einer dieser Punkte offen ist:

- rechtliche Produktionsfreigabe
- bestätigter Mail-/SMTP-Dienstleister
- bestätigter VSBG-Status
- finaler Leistungskatalog
- finales Einsatzgebiet
- freigegebene Original-Projektmedien
- erfolgreich getestete reale Formularzustellung

Die Statuswerte liegen in `src/data/legal.json` und `src/data/release.json`.

## GitHub-Setup vor dem ersten Livegang

Im Repository ein Environment `production` verwenden und dort hinterlegen:

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

Empfohlen:

- Required Reviewer für das Environment `production`
- Deployment nur von `main`
- Secrets ausschließlich im GitHub-Environment, niemals im Repository

## Netlify-Setup

Für das produktive Anfrageformular werden auf Netlify zusätzlich benötigt:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_TO`
- `MAIL_FROM`

Diese Werte gehören in die Netlify-Environment-Variablen und nicht in GitHub oder den Quellcode.

## Rollback

Workflow: `.github/workflows/production-rollback.yml`

Netlify-Deploys sind atomar. Ein vorheriger erfolgreicher Deploy kann über seine Deploy ID wieder live geschaltet werden.

Rollback-Ablauf:

1. gewünschte frühere Deploy ID bestimmen
2. Workflow `Production Rollback` auf `main` starten
3. Deploy ID eintragen
4. exakt `ROLLBACK` bestätigen
5. Workflow stellt den Deploy über die Netlify-API wieder her
6. Smoke Tests prüfen die wichtigsten Live-Routen

Die Deploy ID des neuen Livegangs wird im Summary des Production-Workflows dokumentiert.

## Lokale Befehle

```bash
npm ci
npm run build
npm run qa:static
npm run qa:release
```

`npm run qa:release` prüft die Produktionsfreigaben, veröffentlicht aber nichts.

## Grundsatz

Preview darf schnell sein. Produktion darf nur langweilig sein: reproduzierbar, geprüft, freigegeben und rollback-fähig.
