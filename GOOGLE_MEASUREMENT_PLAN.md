# KS-Innenausbau — Google Measurement Plan

## Ziel
Nicht nur optimieren, sondern nach dem Relaunch messen, ob Google Business Profile und Website tatsächlich mehr qualifizierte Anfragen erzeugen.

## 1. Google Business Profile — native Performance-Daten

Für ein bestätigtes Unternehmensprofil können Inhaber/Manager u. a. auswerten:
- Suchanfragen, bei denen das Profil erschien
- Profilaufrufe in Suche/Maps
- Anrufklicks
- Websiteklicks
- ggf. Wegbeschreibungsanfragen und weitere relevante Interaktionen

### Baseline am Freitag sichern
Vor größeren Änderungen möglichst den aktuellen Zeitraum dokumentieren:
- [ ] Profilaufrufe
- [ ] Websiteklicks
- [ ] Anrufklicks
- [ ] wichtigste Suchanfragen
- [ ] aktueller Review-Stand
- [ ] aktueller Foto-Bestand

Dann monatlich dieselben Kennzahlen vergleichen.

## 2. Google Search Console — für die neue Website

Am Freitag prüfen:
- [ ] existiert bereits eine Search-Console-Property für `wunschausbau.de`?
- [ ] wer ist Inhaber?
- [ ] wenn nicht vorhanden: Domain-Property bevorzugt einrichten, sofern DNS-Zugriff verfügbar ist; alternativ geeignete URL-Präfix-Verifizierung.

Nach Relaunch:
- [ ] Sitemap einreichen
- [ ] Startseite prüfen
- [ ] alle Leistungsseiten auf Indexierbarkeit prüfen
- [ ] wichtigste Suchanfragen und Seiten beobachten
- [ ] Crawling-/Indexierungsfehler prüfen
- [ ] strukturierte Daten prüfen

### Kernseiten
- Startseite
- Leistungen-Übersicht
- Innenausbau/Komplettrenovierung
- Böden
- Innentüren
- Fenster & Außentüren
- Trockenbau
- Sonnenschutz
- Holzterrassen
- Kontakt
- Referenzen

## 3. UTM-Link aus dem Google Business Profile

Vorbereitet:
`https://www.wunschausbau.de/?utm_source=google&utm_medium=organic&utm_campaign=gbp`

Wichtig: Ein UTM-Parameter allein erzeugt keine eigene Auswertung. Er ist erst dann separat auswertbar, wenn ein geeignetes Analytics-/Server-Log-System diese Parameter erfasst.

Der Link kann trotzdem von Anfang an verwendet werden, damit die Kennzeichnung bereits sauber ist und später nicht geändert werden muss.

## 4. Analytics — bewusst nicht automatisch aktivieren

Die aktuelle Website ist privacy-first und enthält laut Projektstand keine Tracking-Dienste/Cookies.

Google Analytics oder andere Besucheranalyse daher **nicht einfach ungeprüft hinzufügen**. Vor Aktivierung müssen insbesondere Datenschutz, Consent-/Cookie-Anforderungen und der gewünschte Messumfang geklärt werden.

Für Phase 1 reichen:
- Google Business Profile Performance
- Google Search Console
- eingehende Kontaktformular-Anfragen
- Telefon-/WhatsApp-Anfragen, intern mit Quelle erfragen (`Wie sind Sie auf uns aufmerksam geworden?`)

## 5. Lead-Messung ohne zusätzlichen Tracker

Monatlich einfache Tabelle führen:
- neue Anfragen gesamt
- Quelle bekannt: Google / Empfehlung / Instagram / sonstige
- Leistung
- Ort
- qualifizierte Anfrage ja/nein
- Angebot erstellt ja/nein
- Auftrag ja/nein
- grober Auftragswert (optional intern)

Damit lässt sich beurteilen, ob mehr Sichtbarkeit tatsächlich bessere Aufträge erzeugt.

## 6. Ziele nach Relaunch

Keine künstlichen Ranking-Garantien. Beobachtet werden:
- mehr relevante Google-Suchanfragen statt nur Markenname
- steigende Profilinteraktionen
- mehr Websiteklicks aus GBP
- steigende organische Sichtbarkeit der Leistungsseiten
- mehr echte Google-Rezensionen
- mehr qualifizierte Anfragen aus Wittlich/Mosel/Trier

## 7. Freitag — nur fünf Mess-Fragen

- [ ] Ist GBP vollständig verifiziert und Performance sichtbar?
- [ ] Baseline-Screenshot/Notizen der aktuellen Performance sichern.
- [ ] Gibt es schon Search Console für wunschausbau.de?
- [ ] Wer hat Domain-/DNS-Zugriff für Verifizierung?
- [ ] Soll vorerst privacy-first ohne Analytics-Cookie gestartet werden? Empfehlung: ja, bis Recht/Consent sauber entschieden ist.
