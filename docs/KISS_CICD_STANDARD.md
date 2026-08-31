# KISS CI/CD Standard – wunschausbau.de

Stand: 31.08.2026

## Ziel

Änderungen sollen früh geprüft, reproduzierbar gebaut und kontrolliert veröffentlicht werden. Ein normaler Commit darf die Produktionsdomain niemals ungeprüft verändern. Nach dem Livegang muss der produktive Zustand außerdem automatisch überwacht werden.

## Pipeline

### 1. Pull Request – CI

Workflow: `.github/workflows/pr-quality.yml`

Vor dem Merge nach `main` laufen:

- `npm ci`
- Syntaxprüfung der Node-/Netlify-Skripte
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
- Lighthouse; im Produktionsmodus ist SEO mit mindestens 95/100 Teil des Gates
- vorhandene Netlify-Zugangsdaten

Der Netlify-Deploy verwendet einen bereits geprüften Build (`--no-build`). Dadurch baut Netlify nicht stillschweigend einen anderen Stand als den zuvor geprüften Kandidaten.

Nach dem Deploy laufen Smoke Tests gegen Startseite, Leistungen, Kontakt und `robots.txt`.

### 4. Production Monitoring – Betrieb nach dem Relaunch

Workflow: `.github/workflows/production-monitor.yml`

Das Monitoring ist vor dem Relaunch absichtlich deaktiviert. Geplante Runs werden nur ausgeführt, wenn die Repository Variable `PRODUCTION_MONITORING_ENABLED` exakt auf `true` gesetzt wurde. Manuelle Runs bleiben unabhängig davon möglich.

Nach Aktivierung prüft GitHub Actions stündlich:

- Startseite, Leistungen und Kontakt sind erreichbar
- Redirect-Ziel bleibt HTTPS
- Startseite enthält kein versehentliches `noindex`
- Canonical zeigt auf `wunschausbau.de`
- JSON-LD Structured Data ist vorhanden
- `robots.txt` sperrt nicht die gesamte Website und verweist auf die Sitemap
- `sitemap-index.xml` ist erreichbar und enthält die Produktionsdomain
- `GET /api/anfrage` liefert erwartungsgemäß HTTP 405; dadurch wird die Netlify Function geprüft, ohne eine echte Anfrage oder E-Mail zu erzeugen
- TLS-Zertifikat ist gültig und hat mindestens 14 Tage Restlaufzeit
- langsame Antworten werden als Warnhinweis dokumentiert

Bei einem Fehler wird ein GitHub-Issue mit dem festen Monitoring-Titel angelegt. Weitere Fehlläufe kommentieren denselben Incident, statt neue Issues zu erzeugen. Sobald das Monitoring wieder grün ist, wird der Incident dokumentiert und automatisch geschlossen.

Monitoring-Reports werden als Actions-Artefakte 30 Tage aufbewahrt.

Das GitHub-Monitoring ist der kostenfreie technische Basis-Schutz. Für garantierte externe Uptime-Prüfung oder SLA-Betrieb kann später zusätzlich ein unabhängiger Monitoring-Dienst eingesetzt werden; dieser ist für den ersten Launch nicht erforderlich.

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

### Environment `production`

Im Repository ein Environment `production` verwenden und dort hinterlegen:

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

Empfohlen:

- Required Reviewer für das Environment `production`
- Deployment nur von `main`
- Secrets ausschließlich im GitHub-Environment, niemals im Repository

### Branch Protection für `main`

Status bei Erstellung dieses Dokuments: `main` ist noch **nicht geschützt**. Das muss vor dem ersten regulären Kundenbetrieb geändert werden.

Empfohlene Regeln:

- Require a pull request before merging
- Require status checks to pass before merging
- Pflichtcheck: `KISS Quality Gate`
- Require branches to be up to date before merging
- Block force pushes
- Block branch deletion
- Regeln auch für Administratoren anwenden, soweit für den persönlichen Workflow praktikabel

Danach gilt der gewünschte Weg verbindlich:

`Feature Branch → Pull Request → KISS Quality Gate → Merge → Preview → manueller Production Deploy`

### Monitoring nach erfolgreichem Livegang aktivieren

Erst wenn Domain, HTTPS, Formular, robots.txt und Sitemap auf der neuen Produktionsseite erfolgreich geprüft sind:

1. Repository Variable `PRODUCTION_MONITORING_ENABLED` mit Wert `true` anlegen.
2. Workflow `Production Monitoring` einmal manuell ausführen.
3. Prüfen, dass der Run grün ist und ein Monitoring-Artefakt erzeugt wurde.
4. Danach übernimmt der stündliche Schedule die Basisüberwachung.

Vor dem Relaunch darf die Variable nicht auf `true` gesetzt werden, weil die alte Produktionsseite die neuen technischen Erwartungen noch nicht erfüllen muss.

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
npm run qa:monitor
```

`npm run qa:release` prüft die Produktionsfreigaben, veröffentlicht aber nichts.

`npm run qa:monitor` prüft standardmäßig `https://wunschausbau.de`. Vor dem Relaunch ist ein Fehlschlag daher erwartbar und kein Freigabesignal für die neue Preview.

## Grundsatz

Preview darf schnell sein. Produktion darf nur langweilig sein: reproduzierbar, geprüft, freigegeben, überwacht und rollback-fähig.
