# KISS Betriebsstandard — Wunschausbau2

Stand: 14.09.2026

Ziel: Festlegen, wie KISS `wunschausbau.de` nach Verkauf und Livegang sicher, nachvollziehbar und ohne improvisierte Einzelentscheidungen betreibt.

## 1. Eigentums- und Rollenmodell

### Kunde / KS-Innenausbau
- Domaininhaber / wirtschaftliche Kontrolle über `wunschausbau.de`
- Eigentümer des Google Business Profile
- Eigentümer bzw. Inhaber der Kundendaten, Marken, Logos, Fotos und Projektunterlagen
- Eigentümer des bestehenden Mailkontos / Mailvertrags, sofern nicht separat anders vereinbart

### KISS
- technischer Betreiber der Website im Rahmen des Care-Vertrags
- Verwaltung des Website-Codes
- Deployment / Rollback
- Hostingverwaltung
- Monitoring
- technische Wartung
- dokumentierte Manager-/Arbeitszugriffe auf externe Konten

## 2. Source of Truth

Website-Code:
- privates GitHub-Repository `hapo3005/wunschausbau_2` bzw. später KISS-Organisation
- Branch `main` = freigegebener Produktionsstand
- keine direkten Produktionsänderungen ohne Git-Commit

Kundendaten/Fakten:
- zentrale Datenfiles im Repository
- keine widersprüchlichen Kontaktdaten in mehreren Dateien pflegen
- Änderungen an rechtlichen/faktischen Unternehmensdaten nur nach Kundennachweis/Freigabe

## 3. Zugangssicherheit

Pflichtstandard:
- Passwortmanager verwenden
- eindeutige Passwörter je Dienst
- 2FA aktivieren, wo verfügbar
- keine Passwörter in GitHub, Tickets, Dokumentation oder normalen E-Mails speichern
- keine Master-Logins des Kunden verlangen, wenn Manager-/Delegationszugang möglich ist
- Zugänge bei Ende der Zusammenarbeit gezielt entziehen

Empfohlene Tresorstruktur:

```text
KISS
├── Intern
└── Kunden
    └── KS-Innenausbau
        ├── Domain-DNS
        ├── Hosting
        ├── SMTP-Mail
        ├── Google-Search-Console
        ├── Google-Business
        └── Social-Profile
```

## 4. Kundenakte

Für KS-Innenausbau wird eine zentrale Betriebsakte geführt mit:
- Kundennummer
- Vertragsstatus
- Care-Paket
- Domain / Registrar / DNS-Provider
- Hostinganbieter / Site-ID
- Mailprovider
- DNS-Baseline
- GitHub-Repo
- Produktionsbranch
- Search-Console-Property
- Google-Business-Zugriffsrolle
- Backupstatus
- Monitoringstatus
- SSL-Status
- Formular-Testdatum
- letzter Produktionsrelease
- letzter Restore-Test
- letzte Kundenfreigabe

## 5. Deploymentstandard

Vor Produktion:
1. Änderungen im Repository
2. Build erfolgreich
3. QA-Gates erfolgreich
4. keine offenen Launch-/Legal-Gates
5. Freigabe für kundenrelevante Inhaltsänderungen
6. Deployment
7. Smoke-Test
8. Monitoring beobachten

Nach Deployment prüfen:
- Startseite 200
- Kernseiten 200
- 404 funktioniert
- HTTPS
- Canonicals
- Assets
- Formular
- mobile Navigation
- keine Preview-/GitHub-Pfade

## 6. Backupstandard

Mindestens drei Schutzebenen:
1. Git-Historie für Website-Code
2. Hosting-/Deployment-Rollback
3. externe/dokumentierte Sicherung der relevanten Produktionskonfiguration und Kundenassets

Zusätzlich vor Domain-/DNS-Änderungen:
- aktuelle DNS-Zone dokumentieren/exportieren
- alte Website sichern
- bestehenden Hostingstand dokumentieren

Für dynamische Datenbanken gilt später ein eigener Datenbank-Backupstandard; Wunschausbau2 ist aktuell statisch und benötigt keine Website-Datenbank.

## 7. Restore-Test

Ein Backup gilt für KISS erst als belastbar, wenn Wiederherstellung praktisch geprüft wurde.

Für Wunschausbau:
- dokumentierter Rollback auf vorheriges Deployment
- Test, dass ein älterer Git-Stand wieder gebaut werden kann
- DNS-Rollback-Daten vor Domainumstellung vorhanden

Restore-Test mindestens nach größeren Infrastrukturänderungen erneut durchführen.

## 8. Monitoring

Mindestens überwachen:
- `https://www.wunschausbau.de/` erreichbar
- kanonische Domain erreichbar
- gültiges TLS/SSL
- HTTP-Status
- Antwortzeit-Trend

Zusätzlich regelmäßig:
- Formularzustellung real testen
- Search Console auf Indexierungs-/Crawlprobleme prüfen
- Deployment-/Buildfehler beobachten

Ziel: KISS erfährt von einer technischen Störung möglichst vor dem Kunden.

## 9. Formularbetrieb

Technischer Weg:

```text
Besucher
→ Kontaktformular
→ /api/anfrage
→ Netlify Function
→ SMTP
→ kontakt@wunschausbau.de
```

Vor Livegang:
- SMTP_HOST gesetzt
- SMTP_PORT gesetzt
- SMTP_USER gesetzt
- SMTP_PASS gesetzt
- MAIL_TO bestätigt
- MAIL_FROM bestätigt
- reale Zustellprüfung
- Reply-To geprüft
- Honeypot geprüft
- Fehlerszenario geprüft

Im Care-Betrieb:
- reale Testanfrage nach relevanten Änderungen
- mindestens quartalsweise Funktionstest, sofern nicht automatisiert

## 10. Domain-/DNS-Standard

Grundsatz:
- Domain bleibt beim Kunden
- KISS dokumentiert vor Änderungen immer den Ist-Zustand
- keine Nameserver-/DNS-Komplettumstellung, wenn eine gezielte Record-Anpassung genügt
- Mail-DNS wird nicht angefasst, sofern keine Mailmigration beauftragt ist

Vor Cutover sichern:
- A/AAAA
- CNAME
- MX
- TXT/SPF
- DKIM
- DMARC
- sonstige Verifizierungsrecords

## 11. E-Mail

KISS-Websitebetrieb und Kunden-Mailbetrieb grundsätzlich trennen.

Für Wunschausbau:
- bestehende Mailbox `kontakt@wunschausbau.de` möglichst beibehalten
- Websiteformular nutzt den abgestimmten SMTP-Weg
- kein Wechsel von MX/Mailprovider nur wegen Website-Relaunch

Falls später E-Mail-Migration gewünscht: separater Auftrag mit eigenem Migrationsplan.

## 12. Datenschutz im Betrieb

Vor Go-live dokumentieren:
- Hostinganbieter
- Mail-/SMTP-Anbieter
- mögliche Unterauftragsverarbeiter
- AVV/Datenschutzverträge, soweit erforderlich
- Speicher-/Logkonzept

Änderungen an Tracking, Maps, Videos, Chat, Analytics oder Marketingtechnologien lösen einen erneuten Datenschutz-/Consent-Check aus.

## 13. Supportmodell

Empfehlung KISS Care Business:
- regulärer technischer Supportkanal: KISS-E-Mail/Ticketsystem, sobald eingerichtet
- kritischer Ausfall: priorisiert
- normale Inhaltsänderungen nach Reihenfolge
- bis 30 Minuten kleine Inhaltskorrekturen/Monat inklusive, nicht kumulierbar
- darüber hinaus 95 € netto/Stunde nach Freigabe

Keine verbindlichen SLA-Reaktionszeiten versprechen, bevor KISS organisatorisch 24/7 oder feste Bereitschaft tatsächlich leisten kann.

## 14. Change Management

Jede relevante Änderung wird klassifiziert:

### Klein
Textkorrektur, Telefonnummer, Bildtausch ohne Layout-/Funktionsänderung.

### Mittel
Neue Inhaltssektion, größere Layoutanpassung, neue Leistungsseite.

### Groß
Neue Funktion, Drittanbieterintegration, neues Backend, neues Buchungs-/Shop-System.

Mittel/Groß: Aufwand vor Umsetzung freigeben.

## 15. Incident-Standard

Bei Störung:
1. Problem verifizieren
2. Umfang feststellen
3. letzten Release / Providerstatus prüfen
4. wenn releasebedingt: Rollback
5. wenn DNS/SSL: Baseline prüfen
6. wenn SMTP: Provider/Logs prüfen
7. Kunde bei relevanter Außenwirkung informieren
8. Ursache dokumentieren
9. Fix testen
10. Nachbereitung / Prävention

## 16. Übergabe bei Vertragsende

Geordnete Übergabe:
- Domain bleibt beim Kunden
- KISS-Managerzugriffe entfernen
- nötige kundenbezogene Zugangsdaten/Providerinformationen übergeben
- finalen Website-Stand in vereinbarter Form bereitstellen
- laufende Drittanbieter-Abos klären
- Monitoring deaktivieren/übertragen
- personenbezogene Kundendaten nach vertraglichen/gesetzlichen Vorgaben löschen oder zurückgeben

Interne KISS-Tools, Automationen, generische Komponenten und Betriebs-Know-how bleiben bei KISS, sofern nicht ausdrücklich anders vereinbart.

## 17. Go-live Gate

Hosting wird erst eingerichtet, wenn folgende Punkte grün sind:
- [ ] Kundenstammdaten final
- [ ] Leistungen/Region final
- [ ] Bilder/Rechte final
- [ ] Claims final
- [ ] Rechtstexte final geprüft
- [ ] Domain-/DNS-Zugang geklärt
- [ ] Mailprovider/SMTP geklärt
- [ ] Angebot/Vertrag geklärt
- [ ] Care-Modell gewählt
- [ ] Repo privat und Zugänge abgesichert

Danach erst Produktionshosting und Domain-Cutover.
