# wunschausbau.de — Domain / Relaunch Cutover Plan

Stand: 26.08.2026

## Ausgangslage

Die öffentliche Domain `https://www.wunschausbau.de/` liefert aktuell noch den alten Auftritt mit Preisführer-Kommunikation und dem alten Leistungsmix aus.

Die neue Astro-Version wird derzeit über GitHub Pages unter dem Projektpfad `/wunschausbau_2/` als Vorschau bereitgestellt.

**Wichtig:** GitHub Pages ist für die aktuelle Architektur kein geeigneter Produktionshost, weil das Anfrageformular unter `/api/anfrage` als Netlify Function implementiert ist. Für den produktiven Relaunch ist Netlify bereits im Repo vorbereitet.

## 1. Warum Netlify für Produktion

Vorhanden:

- `netlify.toml`
- Build: `npm run build`
- Publish-Verzeichnis: `dist`
- Sicherheitsheader
- Netlify Function `netlify/functions/anfrage.mjs`
- Formular-Endpoint `/api/anfrage`
- SMTP-basierter Mailversand

Der Astro-Build ist bereits so konfiguriert, dass er **außerhalb GitHub Actions** automatisch mit:

- `site: https://wunschausbau.de`
- `base: /`

gebaut wird.

Damit passen Canonicals, Sitemap und Asset-Pfade für die Produktionsdomain.

## 2. Vor Freitag von Kevin klären / Zugriff sichern

- [ ] Wer verwaltet `wunschausbau.de`?
- [ ] Domain-Registrar / DNS-Provider: ____________________
- [ ] Kevin kann sich dort selbst einloggen
- [ ] bestehendes Hosting der alten Seite identifizieren
- [ ] Backup / Export der alten Seite sichern, bevor DNS geändert wird
- [ ] bestehende E-Mail-Nutzung der Domain prüfen (MX-Einträge dürfen beim Web-DNS-Cutover nicht beschädigt werden)
- [ ] gewünschte Zieladresse für Formularanfragen (`MAIL_TO`)
- [ ] SMTP-Zugang / Mailanbieter klären

**Keine Passwörter weitergeben. Kevin loggt sich selbst ein oder erstellt gezielte Zugänge.**

## 3. Netlify-Produktion vorbereiten

- [ ] GitHub-Repo `hapo3005/wunschausbau_2` mit Netlify verbinden
- [ ] Production Branch: `main`
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Node-Version mit Projekt/Build kompatibel setzen
- [ ] ersten Netlify-Preview-/Production-Build prüfen

### Erforderliche Environment Variables

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_TO`
- `MAIL_FROM`

Danach reale Testanfrage senden und prüfen:

- [ ] E-Mail kommt an
- [ ] Reply-To entspricht Kunden-E-Mail, wenn vorhanden
- [ ] Pflichtfelder korrekt
- [ ] Spam-Honeypot funktioniert
- [ ] Weiterleitung auf `/danke/`
- [ ] Fehlerszenario zeigt Telefon-Fallback

## 4. Domain anbinden

Erst wenn Website und Formular auf der Netlify-Subdomain vollständig geprüft sind:

1. `wunschausbau.de` als Custom Domain in Netlify hinzufügen.
2. `www.wunschausbau.de` ebenfalls hinzufügen.
3. eine kanonische Variante festlegen; Empfehlung: Domain-Strategie konsistent mit bestehenden Links halten.
4. DNS-Einträge exakt nach Netlify-Vorgabe setzen.
5. **MX-/Mail-DNS nicht verändern.**
6. HTTPS-Zertifikat aktivieren / Ausstellung abwarten.
7. HTTP → HTTPS prüfen.
8. www ↔ non-www Weiterleitung prüfen.

## 5. SEO-Cutover

Vor DNS-Umschaltung:

- [ ] aktuelle indexierte Seiten der alten Website dokumentieren
- [ ] alte URLs sammeln
- [ ] prüfen, ob außer `/` weitere relevante URLs existieren
- [ ] Redirect-Mapping alt → neu erstellen

Nach Umschaltung:

- [ ] Startseite liefert 200
- [ ] Leistungsseiten liefern 200
- [ ] Canonicals zeigen auf `wunschausbau.de`
- [ ] `sitemap-index.xml` bzw. erzeugte Sitemap erreichbar
- [ ] `robots.txt` erreichbar
- [ ] keine Links enthalten `/wunschausbau_2/`
- [ ] keine GitHub-Pages-Canonicals
- [ ] keine Mixed-Content-Fehler
- [ ] 404-Seite funktioniert

### Search Console

- [ ] vorhandene Property prüfen
- [ ] Domain-Property bevorzugen, wenn DNS-Zugriff vorhanden
- [ ] neue Sitemap einreichen
- [ ] Startseite und Kern-Leistungsseiten URL-Prüfung
- [ ] Indexierung beobachten

## 6. Google Business Profile erst nach Produktionsprüfung umschalten

Der GBP-Website-Link wird erst auf den final getesteten Relaunch gesetzt bzw. bestätigt, wenn:

- Domain korrekt zeigt
- HTTPS sauber ist
- Kontaktformular funktioniert
- Rechtstexte final sind
- echte Stammdaten eingetragen sind

Vorbereiteter Tracking-Link:

`https://www.wunschausbau.de/?utm_source=google&utm_medium=organic&utm_campaign=gbp`

## 7. Recht / Inhalte als Launch-Gate

Kein finaler Domain-Cutover, solange diese Punkte offen sind:

- [ ] vollständiges Impressum
- [ ] finale Datenschutzerklärung
- [ ] AGB entweder korrekt vorhanden oder Seite/Link entfernt
- [ ] Kevin bestätigt `500+ Projekte` oder Wert wird korrigiert/entfernt
- [ ] `24 h`-Versprechen bestätigt oder korrigiert
- [ ] Kundenstimmen echt/freigegeben
- [ ] Projektbilder echt und veröffentlichbar

## 8. Externe Profile nach Cutover synchronisieren

Nach erfolgreichem Domain-Relaunch:

1. Google Business Profile
2. MyHammer
3. Instagram
4. weitere Branchenverzeichnisse / Anzeigen bei Neuauflage

Überall dieselbe Website, Telefonnummer, Positionierung und Leistungsliste.

## 9. Rollback

Vor Cutover:

- alte Website sichern
- aktuelle DNS-Werte dokumentieren
- bestehende Hosting-Daten dokumentieren

Falls nach Umschaltung ein kritisches Problem auftritt:

- DNS auf dokumentierten alten Stand zurücksetzen
- Mail-DNS unverändert lassen
- Ursache in Netlify beheben
- erneuten Cutover erst nach Test

## 10. Definition of Done

Der Relaunch ist technisch abgeschlossen, wenn:

- `wunschausbau.de` und gewünschte www-Variante korrekt auf den neuen Auftritt zeigen
- HTTPS aktiv
- alle Kernseiten funktionieren
- Formular real getestet
- keine `/wunschausbau_2/`-Pfade auf Produktion
- Canonicals/Sitemap/robots korrekt
- Rechtstexte final
- Search Console eingerichtet/geprüft
- GBP und externe Profile auf die finale Domain synchronisiert
