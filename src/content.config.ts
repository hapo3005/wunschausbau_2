import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Leistungen: eine Markdown-Datei pro Gewerk.
 * Der Dateiname ist der URL-Slug (z. B. boeden.md -> /leistungen/boeden/).
 */
const leistungen = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/leistungen' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      kurztext: z.string(),
      reihenfolge: z.number(),
      bild: image(),
      bildAlt: z.string(),
      metaDescription: z.string()
    })
});

const leistungsSlugs = [
  'boeden',
  'fenster-aussentueren',
  'holzterrassen',
  'innentueren',
  'komplettrenovierung',
  'sonnenschutz',
  'trockenbau'
] as const;

/**
 * Referenzen: echte, freigegebene KS-Projekte.
 * Nur Einträge mit published: true dürfen öffentlich gerendert werden.
 * Keine Demo-/Stock-Projekte in dieser Collection anlegen.
 * Leistungszuordnungen werden gegen den realen Leistungskatalog validiert,
 * damit Tippfehler keine stillen, unvollständigen Case Studies erzeugen.
 */
const referenzen = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/referenzen' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(3),
      ort: z.string().min(2),
      jahr: z.string().optional(),
      leistungen: z.array(z.enum(leistungsSlugs)).min(1),
      kurztext: z.string().min(20),
      metaDescription: z.string().min(80).max(180),
      hero: image(),
      heroAlt: z.string().min(8),
      galerie: z.array(z.object({
        bild: image(),
        alt: z.string().min(8),
        caption: z.string().optional()
      })).default([]),
      reihenfolge: z.number().default(100),
      published: z.boolean().default(false)
    })
});

export const collections = { leistungen, referenzen };
