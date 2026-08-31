# KISS Referenzstandard – KS-Innenausbau

Eine Referenz wird erst als öffentliche Case Study angelegt, wenn Projektinhalt und Medien belastbar freigegeben sind. Keine Demo-, Stock- oder nachträglich erfundenen Projektdaten als reale Referenz veröffentlichen.

## Pflichtangaben vor `published: true`

- Projekttitel / neutrale Bezeichnung
- Ort oder Region ohne unnötig genaue Privatadresse
- ungefährer Zeitraum oder Jahr, falls freigegeben
- tatsächlich von KS ausgeführte Leistungen
- kurze Ausgangslage
- konkrete Aufgabe / Problemstellung
- relevante Materialien oder Ausführungsdetails
- Ergebnis / was sich für den Kunden verändert hat
- Freigabe aller verwendeten Bilder und Videos
- Urheber bzw. Nutzungsrecht dokumentiert
- erkennbare Personen, Kennzeichen, Hausnummern und sensible Details geprüft

## Empfohlene Bildstrecke

1. Ein starkes Querformat als Hero
2. Ausgangslage / Vorher, wenn vorhanden
3. mindestens ein Detail der Ausführung
4. ein Material- oder Anschlussdetail
5. fertiger Raum / fertige Fläche
6. optional Vorher-Nachher aus möglichst ähnlicher Perspektive

Originaldateien verwenden (JPG/HEIC, MP4/MOV), keine Screenshots und möglichst keine WhatsApp-/Instagram-Komprimierung.

## Inhaltliche Struktur der Markdown-Datei

```md
---
title: "Projektbezeichnung"
ort: "Wittlich"
jahr: "2026"
leistungen:
  - boeden
  - innentueren
kurztext: "Kurze, konkrete Zusammenfassung des Projekts."
metaDescription: "Konkrete Beschreibung des realen Projekts und der ausgeführten Arbeiten."
hero: "../../assets/referenzen/projekt-slug/hero.jpg"
heroAlt: "Sachliche Beschreibung des sichtbaren Projektergebnisses"
galerie:
  - bild: "../../assets/referenzen/projekt-slug/detail-01.jpg"
    alt: "Sachlicher Alt-Text"
    caption: "Optionaler Kontext"
reihenfolge: 10
published: false
---

Einleitung: Ausgangslage und Ziel des Projekts.

## Ausgangslage

Was war vorhanden, was sollte verändert werden?

## Umsetzung

Welche Arbeiten hat KS tatsächlich ausgeführt? Welche Entscheidungen oder Details waren wichtig?

## Ergebnis

Was wurde konkret erreicht? Keine unbelegten Superlative oder Kundenzitate ergänzen.
```

## Publishing-Regel

`published: false` bleibt gesetzt, bis Inhalt, Leistungsumfang und Medienfreigabe geprüft sind. Erst danach auf `true` stellen. Die öffentliche Referenzübersicht und die Detailroute berücksichtigen ausschließlich freigegebene Einträge.
