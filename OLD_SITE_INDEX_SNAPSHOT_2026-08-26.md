# wunschausbau.de — Old Site Index Snapshot

Stand: 26.08.2026

## Zweck

Vor dem Relaunch dokumentieren, welche alten Seiten öffentlich über Suchmaschinen auffindbar sind, damit Redirects und Indexierungsprüfung nicht erst nach dem DNS-Cutover beginnen.

## Öffentliche Websuche

Bei `site:wunschausbau.de` / markenbezogenen Suchen wurde aktuell im Wesentlichen nur die alte Startseite gefunden:

- `https://www.wunschausbau.de/`

Der öffentlich gecrawlte Inhalt entspricht noch dem alten Auftritt mit Preisführer-Kommunikation und altem Leistungsmix.

## Konsequenz

Das aktuell sichtbare Redirect-Risiko wirkt gering, weil keine große alte Unterseitenstruktur in der öffentlichen Suche auftaucht.

Trotzdem vor dem Produktions-Cutover prüfen:

- [ ] Google Search Console: indexierte Seiten
- [ ] Sitemap/alte Sitemap, falls vorhanden
- [ ] Analytics/Serverlogs, falls vorhanden
- [ ] alte interne Links / Bookmarks
- [ ] eventuelle HTTP-/www-/non-www-Varianten

Wenn dort weitere alte URLs auftauchen, Mapping `alte URL → passende neue URL` anlegen und permanent weiterleiten.

## Neue Kernziele

- `/`
- `/leistungen/`
- `/leistungen/komplettrenovierung/`
- `/leistungen/boeden/`
- `/leistungen/innentueren/`
- `/leistungen/fenster-aussentueren/`
- `/leistungen/trockenbau/`
- `/leistungen/sonnenschutz/`
- `/leistungen/holzterrassen/`
- `/referenzen/`
- `/ueber-uns/`
- `/kontakt/`

## Nicht öffentlich indexieren

- `/danke/`
- `/freigabe/`

Die GitHub-Pages-Vorschau wird unabhängig davon vollständig mit `noindex` ausgeliefert.
