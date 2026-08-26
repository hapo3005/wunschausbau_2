# KS / wunschausbau.de — Preflight Audit vor Freitag

**Stand:** 26.08.2026  
**Ziel:** Alle Punkte trennen in `bereit`, `vor Freitag technisch lösbar`, `Kevin muss bestätigen` und `erst nach Google-Zugriff umsetzbar`.

## A. Google Business Profile

| Bereich | Status | Nächster Schritt |
|---|---|---|
| Zielpositionierung | BEREIT | Premium-/Qualitätspositionierung beibehalten |
| Hauptkategorie | BEREIT | `Auftragnehmer für den Innenausbau` im Google-Editor auf Verfügbarkeit prüfen und nach Freigabe setzen |
| Zusatzkategorien | BEREIT | nur real passende Kategorien setzen |
| Unternehmensbeschreibung | BEREIT | Ready-to-paste Text vorhanden |
| Services | BEREIT | kompletter Katalog mit Beschreibungen vorhanden |
| Adresse / Standortmodell | BLOCKIERT DURCH FAKT | Kevin: Kundenempfang und dauerhafte Beschilderung klären |
| Einzugsgebiet | FAST BEREIT | Kerngebiet vorbereitet; Kevin bestätigt reale Reichweite |
| Öffnungszeiten | BLOCKIERT DURCH FAKT | Kevin bestätigt reale Erreichbarkeitszeiten |
| Website-Link + UTM | BEREIT | nach finaler Domain-/Liveprüfung in GBP einsetzen |
| Fotos | MATERIAL FEHLT | echte Original-Projektbilder von Kevin |
| Rezensionen | STRATEGIE BEREIT | direkten Google-Review-Link im Konto abrufen |
| Review-Antworten | BEREIT | Vorlagen vorhanden, individuell anpassen |
| Google-Posts | BEREIT | vier Formate vorbereitet; echte Projektfotos/-daten nötig |
| Performance-Messung | BEREIT | UTM-Link + monatlicher Vergleich vorgesehen |

## B. Website — technische/inhaltliche Prüfung

### BEREITS GUT
- Astro-basierter statischer Relaunch mit strukturierten Seiten.
- sieben eigenständige Leistungsseiten.
- Kontaktseite mit Telefon, E-Mail, WhatsApp und strukturiertem Anfrageformular.
- FAQ und `FAQPage`-Schema.
- Startseite mit `HomeAndConstructionBusiness`-Schema.
- kanonische URLs, OpenGraph und Sitemap/robots-Konzept.
- lokale Schriften; keine externen Google-Font-Abfragen.
- responsive Grundstruktur und Accessibility-Basics.

### MUSS VOR PRODUKTIVEM ABSCHLUSS GEKLÄRT WERDEN

#### 1. Unternehmenskennzahlen
Aktuell in `src/data/settings.json`:
- `500+` realisierte Projekte
- `4,9 ★`
- `24 h` Rückmeldung

**Risiko:** Aussagen müssen sachlich korrekt sein.  
**Freitag:** Kevin bestätigt `500+` und `24 h`. Google-Bewertung wird gegen den dann aktuellen öffentlichen Profilwert geprüft.

#### 2. Kundenstimmen
Aktuell hinterlegt:
- Andrea K. — Wittlich
- Marco S. — Bernkastel-Kues
- Daniel H. — Trier

**Risiko:** Keine unbestätigten Testimonials produktiv verwenden.  
**Freitag:** Kevin bestätigt Herkunft/Freigabe oder ersetzt sie durch echte Bewertungen/Kundenstimmen.

#### 3. Impressum
Aktuell fehlen:
- Straße/Hausnummer
- PLZ/Ort
- Rechtsformangaben
- ggf. Umsatzsteuer-ID
- ggf. Kammer/Berufsbezeichnung

**Status:** nicht produktionsreif.

#### 4. Datenschutz
Aktuell nur Platzhalter. Zu berücksichtigen sind mindestens:
- Verantwortlicher
- Hosting/Server-Logs
- Kontaktformular
- E-Mail/Telefon/WhatsApp
- Instagram-Verlinkung
- Betroffenenrechte

**Status:** nicht produktionsreif.

#### 5. AGB
Aktuell nur Platzhalter.  
**Entscheidung Freitag:** vorhandene geprüfte AGB einsetzen oder Seite/Footer-Link entfernen, wenn keine AGB verwendet werden sollen.

#### 6. Local-Business-Schema
Aktuell vorhanden:
- `HomeAndConstructionBusiness`
- Name/AlternateName
- URL
- Telefon
- E-Mail
- Bild/Logo
- `areaServed`
- Leistungen via `knowsAbout`
- Instagram via `sameAs`

Noch zu ergänzen/finalisieren:
- `PostalAddress`, falls öffentliche Geschäftsadresse zulässig/richtig
- bei Service-Area-Modell passende Adress-/Gebietslogik
- finales Google-Unternehmensprofil in `sameAs`
- ggf. Öffnungszeiten nach Kevin-Freigabe

#### 7. Anfrageformular
Technisch vorbereitet, aber vor echtem Go-live erforderlich:
- Netlify SMTP-Variablen setzen
- reale Testanfrage durchführen
- Empfänger/Absender verifizieren
- Datenschutztext finalisieren

#### 8. Bilder
Aktuelle Website-Bilder dürfen nicht als vermeintlich echte Referenzen missverstanden werden, sofern sie nicht echte KS-Projekte sind.

**Freitag:** Originalbilder übernehmen und Signature-Projekte auswählen.

## C. Aussagen, die am Freitag besonders kritisch bestätigt werden müssen

1. `500+ realisierte Projekte`
2. `Rückmeldung in der Regel innerhalb von 24 Stunden`
3. kostenlose Erstberatung / unverbindliches Angebot
4. genaue Liste der tatsächlich angebotenen Leistungen
5. Einsatzgebiet und maximale Strecke
6. alle Testimonials
7. Firmierung / Geschäftsanschrift / Rechtsform
8. Kundenzugang an Förbeltstraße 1
9. Öffnungszeiten
10. Rechte/Freigabe an Projektfotos

## D. Google-Richtlinien, die die Umsetzung beeinflussen

- Hauptkategorie möglichst spezifisch wählen.
- nur wenige Kategorien verwenden, die das Unternehmen als Ganzes beschreiben.
- Kategorien nicht als Keywords missbrauchen.
- Unternehmensname muss dem real nach außen verwendeten Namen entsprechen.
- wenn Kunden nicht an der Geschäftsadresse bedient werden, Adresse im Profil ausblenden und Einzugsgebiet verwenden.
- Service-Area-Business kann bis zu 20 Gebiete hinterlegen; reale Einsatzregion verwenden.
- Kategorienänderungen können ggf. erneute Verifizierung auslösen.
- benutzerdefinierte Services dürfen keine Telefonnummern/unerlaubten Inhalte in der Bezeichnung enthalten.
- Google-Posts können Text, Bild/Video und CTA enthalten; Telefonnummern im Beitragstext können problematisch sein.

## E. Konkurrenz-Learnings

Lokale Wettbewerber nutzen deutlich spezifischere Kategorien als das derzeit generische `Handwerk`, darunter Innenausbau, Trockenbau, Boden, Fenster und Sonnenschutz. Das bestätigt die geplante Präzisierung des KS-Profils.

Wichtig: Nicht Kategorien der Konkurrenz kopieren, sondern nur Kategorien verwenden, auf die für KS die Aussage **„Dieses Unternehmen IST …“** tatsächlich zutrifft.

## F. Bereits angelegte Projektunterlagen

- `GOOGLE_BUSINESS_PROFILE_MASTER.md`
- `GOOGLE_BUSINESS_PROFILE_READY_TO_PASTE.md`
- `KEVIN_TERMIN_2026-08-28.md`
- GitHub Issues für GBP-Grundoptimierung, Services, Reviews/Posts, Website-Sync und Foto-Set

## G. Priorität bis Freitag

### P0 — Muss beim Termin beantwortet werden
Adresse/Standortmodell, Öffnungszeiten, Leistungen, Einzugsgebiet, Stammdaten/Recht, Kennzahlen, Testimonials, Bildfreigaben, Google-Zugriff.

### P1 — Sofort nach Antworten umsetzen
Website-NAP/Schema/Rechtstexte/Fakten/Referenzen synchronisieren und GBP-Grunddaten/Services eintragen.

### P2 — Wachstumsphase
Review-Aufbau, regelmäßige Projektfotos, Google-Posts, lokale Ranking-/Conversion-Beobachtung.

## Fazit

Die strategische und textliche Vorbereitung ist weitgehend abgeschlossen. Die verbleibenden offenen Punkte sind überwiegend **reale Unternehmensfakten, rechtliche Angaben, Bildmaterial und Zugriff auf das Google-Profil**. Diese Dinge dürfen nicht geraten werden und sind deshalb bewusst als Kevin-Entscheidungen/Fakten markiert.
