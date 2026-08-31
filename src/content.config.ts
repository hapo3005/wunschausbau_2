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

/**
 * Referenzen: echte, freigegebene KS-Projekte.
 * Nur Einträge mit published: true dürfen öffentlich gerendert werden.
 * Keine Demo-/Stock-Projekte in dieser Collection anlegen.
 */
const referenzen = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/referenzen' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      ort: z.string(),
      jahr: z.string().optional(),
      leistungen: z.array(z.string()).min(1),
      kurztext: z.string(),
      metaDescription: z.string(),
      hero: image(),
      heroAlt: z.string(),
      galerie: z.array(z.object({
        bild: image(),
        alt: z.string(),
        caption: z.string().optional()
      })).default([]),
      reihenfolge: z.number().default(100),
      published: z.boolean().default(false)
    })
});

export const collections = { leistungen, referenzen };
