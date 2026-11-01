import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Opened weeks. Feeds /availability, the Home preview and the enquiry form's date options. */
const availability = defineCollection({
  loader: file('src/content/availability.json'),
  schema: z.object({
    order: z.number(),
    /** Long form, e.g. "Sun 10 – Sun 17 May 2026" */
    dates: z.string(),
    /** Short form used in the enquiry form, e.g. "10–17 May 2026" */
    short: z.string(),
    status: z.enum(['booking', 'limited', 'sold', 'waitlist']),
    label: z.string(),
    /** Tier summary shown on the Home preview */
    summary: z.string(),
    standard: z.string(),
    signature: z.string(),
    dining: z.string(),
    /** Show in the Home "next bookable weeks" preview */
    featured: z.boolean().default(false),
  }),
});

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

export const collections = { availability, journal };
