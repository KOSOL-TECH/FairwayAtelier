import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { exportAccount } from '../../lib/account/store';

export const prerender = false;

/** The guest's own copy of their data, as a JSON download (GDPR access and portability). */
export const GET: APIRoute = async ({ locals }) => {
  const data = await exportAccount(env.DB, locals.account!.id);
  if (!data) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="fairway-atelier-profile.json"',
    },
  });
};
