# CI/CD Go-Live Checklist

Diese Punkte sind einmalig vor dem ersten echten Production Deploy von wunschausbau.de abzuarbeiten.

## GitHub

- [ ] Environment `production` vorhanden
- [ ] `NETLIFY_AUTH_TOKEN` als Environment Secret hinterlegt
- [ ] `NETLIFY_SITE_ID` als Environment Secret hinterlegt
- [ ] Required Reviewer für `production` gesetzt
- [ ] `main` mit Branch Protection geschützt
- [ ] Pull Request vor Merge verpflichtend
- [ ] Status Check `KISS Quality Gate` verpflichtend
- [ ] Branch muss vor Merge aktuell sein
- [ ] Force Push auf `main` blockiert
- [ ] Löschen von `main` blockiert

## Netlify

- [ ] Projekt/Site für wunschausbau.de vorhanden
- [ ] automatische Production-Veröffentlichung deaktiviert bzw. nicht als Veröffentlichungsweg verwendet
- [ ] `SMTP_HOST` gesetzt
- [ ] `SMTP_PORT` gesetzt
- [ ] `SMTP_USER` gesetzt
- [ ] `SMTP_PASS` gesetzt
- [ ] `MAIL_TO` gesetzt
- [ ] `MAIL_FROM` gesetzt
- [ ] Domain und HTTPS vorbereitet
- [ ] MX-/Mail-DNS unverändert dokumentiert

## KS-Freigaben

- [ ] `legal.launchApproved = true`
- [ ] Mail-/SMTP-Dienstleister in `legal.json` bestätigt
- [ ] VSBG-Status bestätigt
- [ ] finaler Leistungskatalog bestätigt
- [ ] finales Einsatzgebiet bestätigt
- [ ] Original-Projektmedien eingesetzt und freigegeben
- [ ] reale Formularzustellung erfolgreich getestet

## Erster Livegang

- [ ] Workflow `Production Deploy` auf `main` öffnen
- [ ] optionalen Release-Hinweis eintragen
- [ ] exakt `LIVE` bestätigen
- [ ] alle Quality Gates grün
- [ ] Netlify Deploy ID aus Workflow Summary sichern
- [ ] Live-Smoke-Test grün
- [ ] Domain manuell prüfen
- [ ] Formular real erneut prüfen
- [ ] Search Console / Sitemap erst danach freigeben

## Rollback-Test

Nach dem ersten erfolgreichen Livegang einmal kontrolliert verifizieren, dass ein früherer Netlify-Deploy über `Production Rollback` auswählbar wäre. Keinen produktiven Rollback nur zu Testzwecken durchführen.
