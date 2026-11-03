import { env } from 'cloudflare:workers';
import { upcomingWeeks } from '../weeks';
import { FLEXIBLE } from './validate';

/** "Dates of Interest" options: every upcoming published week that is not sold out, then "Flexible". */
export async function getDateOptions(db: D1Database = env.DB): Promise<string[]> {
  const weeks = (await upcomingWeeks(db)).filter((w) => w.status !== 'sold');
  return [...weeks.map((w) => w.short), FLEXIBLE];
}
