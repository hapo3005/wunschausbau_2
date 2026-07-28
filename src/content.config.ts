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

export const collections = { leistungen };
