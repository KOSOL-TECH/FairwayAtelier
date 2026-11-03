import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const journal = defineCollection({
  loader: glob({ pattern: '*.md', base: 'src/content/journal' }),
  schema: ({ image }) => z.object({
    order: z.number(),
    eyebrow: z.string(),
    kicker: z.string(),
    title: z.string(),
    hero: image(),
    lede: z.string(),
    next: z.string(),
    nextLabel: z.string(),
  }),
});

export const collections = { journal };
