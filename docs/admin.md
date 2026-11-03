# Fairway Atelier Admin: design

A private content-management tool at `fairwayatelier.com/admin`, built into the existing Worker. It covers availability weeks, journal articles, page copy and images, and an enquiries inbox. More tools, starting with the CRM, will be added to it later. Agreed with the client on 2026-11-03; the build is tracked in `BACKLOG.md` (T-21 to T-25).

## Decisions

| Topic | Choice |
|---|---|
| Approach | Custom admin in the same Worker (not a Git-based or hosted CMS), so edits go live without a rebuild and the CRM can share the same database and sign-in. |
| First version | Availability weeks, journal articles, page copy and images, enquiries inbox. |
| Week scheduling | Manual status per week (booking / limited / sold / waitlist). No capacity counts or timed release for now. |
| Users | A few named people, all with the same rights. No roles. For now only atelier@fairwayatelier.com (D-11). |
| Images | Resized by Cloudflare Images transformations (D-12). |
| Enquiry retention | Enquiries with no booking are deleted 3 years after the last contact (D-13, counsel to confirm). |
| Copy edits | Go live on save, with no sign-off step (D-14). |

## Architecture

- **Data:** Cloudflare D1 (SQLite), binding `DB`. Schema changes are numbered SQL files in `migrations/`, applied with `npx wrangler d1 migrations apply`.
- **Media:** Cloudflare R2, binding `MEDIA`. Uploads are served from `/media/<key>`, with long cache headers. Resizing for responsive images is open (D-12).
- **Sign-in:** a Cloudflare Access application covers `/admin*` and `/api/admin/*`. Users sign in with a one-time code emailed to them (free up to 50 users). The Worker also verifies the `Cf-Access-Jwt-Assertion` header against the team's public keys, so a misconfigured Access policy cannot expose the admin. The signed-in email is recorded on every change (`audit_log` table).
- **Admin UI:** Astro pages under `src/pages/admin/` with React islands, rendered on demand, `noindex`, and left out of the sitemap and `robots.txt`. It reuses the site's tokens and fonts.
- **Public pages:** pages that show managed content switch from build-time prerendering to on-demand rendering from D1, with an edge cache that is purged when an editor saves. Static pages with no managed content stay prerendered.
- **Enquiries:** a new `D1Sink` in `getEnquirySinks()` stores each enquiry before the emails go out. The inbox lists enquiries with a status (new / replied / closed) and notes. This becomes the CRM's base.

## Working on the admin

- **Code:** `src/middleware.ts` guards `/admin` and `/api/admin`; `src/lib/admin/` holds the Access check and the audit log; pages are in `src/pages/admin/` (each with `export const prerender = false`) and use `src/layouts/AdminLayout.astro`.
- **Locally:** run `npx wrangler d1 migrations apply DB --local` once, then `npm run dev` and open `/admin`. There is no Access locally, so you are signed in as `dev@localhost`. `npm run preview` runs the production build, where `/admin` returns 403 without Access.
- **Schema changes:** add `migrations/000N_name.sql`, apply it locally, then run `npx wrangler d1 migrations apply DB --remote` before pushing code that needs it. Workers Builds does not apply migrations.
- **Access settings:** `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` in `wrangler.jsonc` `vars`. While either is empty, every admin request is refused.
- **Access setup:** team `calm-union-38c3.cloudflareaccess.com`, sign-in by One-time PIN (a code emailed to the user), application "Fairway Atelier Admin" covering `fairwayatelier.com/admin` and `fairwayatelier.com/api/admin`, 24-hour sessions. Created with the `cf` CLI (`cf zero-trust access applications`).
- **Adding a user:** add their email to the policy "Admin users" (Zero Trust → Access → Applications → Fairway Atelier Admin → Policies). No code change needed.

## Data model (first version)

- `weeks`: id, start date, long and short labels, status, status label, Home summary, standard and signature text, dining note, featured flag, sort order, published flag.
- `articles`: slug, order, eyebrow, kicker, title, hero media id, lede, Markdown body, next slug and label, published flag.
- `page_blocks`: page, block key, value (text or media id). Every editable piece of copy on a page has a stable key. Seeded with today's approved copy.
- `media`: R2 key, file name, type, size, alt text, upload details.
- `enquiries`: the enquiry fields, received time, status, notes.
- `audit_log`: who, when, what changed.

## Phases

1. **Foundation (T-21):** D1, Access, JWT check, admin shell, audit log. R2 moves to phase 4, and each phase seeds its own data.
2. **Availability weeks (T-22):** editor; `/availability`, the Home preview and the enquiry form's date options read from D1. Past weeks hidden from the site automatically (based on the start date, not a scheduled release).
3. **Enquiries inbox (T-23):** `D1Sink`, list and detail views, status and notes. Needs the privacy policy to name the retention period (D-13).
4. **Journal articles and media (T-24):** article editor with Markdown preview; image uploads to R2.
5. **Page copy and images (T-25):** keyed blocks for every page, edited in place on a preview of the page.
