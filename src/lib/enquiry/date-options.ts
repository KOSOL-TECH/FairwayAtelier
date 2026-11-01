import { getCollection } from 'astro:content';
import { FLEXIBLE } from './validate';

/** "Dates of Interest" options: every opened week that is not sold out, then "Flexible". */
export async function getDateOptions(): Promise<string[]> {
  const weeks = (await getCollection('availability'))
    .map((w) => w.data)
    .filter((w) => w.status !== 'sold')
    .sort((a, b) => a.order - b.order);
  return [...weeks.map((w) => w.short), FLEXIBLE];
}
