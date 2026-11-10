# Fairway Atelier Admin: design

A private content-management tool at `fairwayatelier.com/admin`, built into the existing Worker. It covers availability weeks, journal articles, page copy and images, and an enquiries inbox. More tools, starting with the CRM, will be added to it later. Agreed with the client on 2026-11-03; the build is tracked in `BACKLOG.md` (T-21 to T-25).

## Decisions

| Topic | Choice |
|---|---|
| Approach | Custom admin in the same Worker (not a Git-based or hosted CMS), so edits go live without a rebuild and the CRM can share the same database and sign-in. |
| First version | Availability weeks, journal articles, page copy and images, enquiries inbox. |
| Week scheduling | Manual status per week (booking / limited / sold / waitlist). No capacity counts or timed release for now. |
| Users | Anyone whose account has the admin role (`docs/accounts.md`, T-33). All admins have the same rights. For now only atelier@fairwayatelier.com (D-11). |
| Images | Resized by Cloudflare Images transformations (D-12). |
| Enquiry retention | Enquiries with no booking are deleted 3 years after the last contact (D-13, counsel to confirm). |
| Copy edits | Go live on save, with no sign-off step (D-14). |

## Architecture

- **Data:** Cloudflare D1 (SQLite), binding `DB`. Schema changes are numbered SQL files in `migrations/`, applied with `npx wrangler d1 migrations apply`.
- **Media:** Cloudflare R2 bucket `fairway-atelier-media`, binding `MEDIA`, described in the D1 `media` table. Served from `/media/<id>?w=<width>`: the Images binding (`IMAGES`) resizes to one of six allowed widths and converts to AVIF or WebP, and the result is cached at the edge forever (a file's bytes never change; a new upload gets a new id). Uploads are checked by reading their real dimensions, so non-images are refused. A file in use by an article or page cannot be deleted.
- **Sign-in:** since T-33 the admin has no login of its own. Everyone signs in at `/sign-in`, and an account with the admin role opens `/admin` (`docs/accounts.md`). Admins sign in with their email and password only, never with Google or Apple, and have no "forgot password". Passwords are stored only as PBKDF2-SHA256 hashes (100,000 iterations, per-user salt) in `accounts`. The session cookie (`__Host-fa_session`, HttpOnly, Secure, SameSite=Lax) is signed with HMAC using the `SESSION_SECRET` Worker secret and carries the account's session key, which the middleware checks against D1 on every admin request; `/admin` also needs a sign-in from the last 12 hours. A new password, a role change or a deleted account ends every session of that account at once, for example after a lost laptop. Attempts are rate-limited to 5 per minute per IP and 5 per minute per email (`LOGIN_LIMITER`), and each admin sign-in is recorded in `audit_log` (`sign_in`). Unknown emails take as long to check as known ones. `src/middleware.ts` refuses every cross-site write. The signed-in email is recorded on every change (`audit_log` table).
- **Page copy (T-25):** every page's editable text and content images are declared once in `src/lib/pages/<page>.ts` (`definePage`, `src/lib/copy.ts`), with the approved copy as each block's default. D1 `page_blocks` stores only edited blocks; saving a value equal to the original deletes its row, so an unedited page renders exactly as approved and "restore" is pasting the original back (the admin shows it under every edited field). Pages call `loadPage(env.DB, page)` and render `c.t.<key>`, `c.md(<key>)` (legal pages, Markdown) or `c.img(<key>)` with `MediaImage`. All pages now render on demand; Astro's `<Image>` for brand graphics resizes through the Images binding at runtime (`imageService: { build: 'compile', runtime: 'cloudflare-binding' }`). Lists have a fixed number of items (numbered blocks): adding a FAQ question or a day is a code change.
- **Admin UI:** Astro pages under `src/pages/admin/` with React islands, rendered on demand, `noindex`, and left out of the sitemap and `robots.txt`. It reuses the site's tokens and fonts.
- **Public pages:** every page renders on demand from D1 and is kept in the Worker cache (tag `content`, 1 hour fresh, a day stale-while-revalidate). Every POST in the admin purges the tag, so edits go live at once (`src/middleware.ts`). If D1 is unreachable, pages show the approved originals from code.
- **Enquiries:** a new `D1Sink` in `getEnquirySinks()` stores each enquiry before the emails go out. The inbox lists enquiries with a status (new / replied / closed) and notes. This becomes the CRM's base.

## Working on the admin

- **Code:** `src/middleware.ts` guards `/admin` and `/api/admin` (admin role, recent sign-in). `src/lib/account/` holds accounts, sessions and sign-in; `src/lib/admin/` holds password hashing and the audit log. Pages are in `src/pages/admin/` (each with `export const prerender = false`) and use `src/layouts/AdminLayout.astro`.
- **Adding an admin or changing an admin's password:** `node scripts/set-admin-password.mjs <email>` (add `--local` for the local database). It asks for the password twice, hidden, needs at least 12 characters, and sends only the hash to D1. It creates the account if needed, makes it an admin, and signs it out everywhere. An existing guest with a confirmed email and a password can also be made an admin on their customer sheet (Admin → Customers). To remove an admin, set their role back to Guest there.
- **Signing everyone out:** set a new `SESSION_SECRET` (`npx wrangler secret put SESSION_SECRET`, any long random value). While it is missing, nobody can sign in.
- **Locally:** run `npx wrangler d1 migrations apply DB --local` once, then `npm run dev` and open `/admin`; dev mode opens the admin as `dev@localhost` without signing in. To test the real sign-in, put `SESSION_SECRET=<random>` in `.dev.vars`, create a local admin with the script and `--local`, and use `npm run preview`.
- **Schema changes:** add `migrations/000N_name.sql`, apply it locally, then run `npx wrangler d1 migrations apply DB --remote` before pushing code that needs it. Workers Builds does not apply migrations.

## Adding an editable page or field

1. Add the block to the page's registry in `src/lib/pages/<page>.ts` with the current text as `default`.
2. Render it in the page with `c.t.<key>` (or `c.md` / `c.img`).
3. A new page also needs `export const prerender = false;`, a registry file, and an entry in `PAGES` (`src/lib/pages/index.ts`).

Never rename a page `id` or block key once live: stored edits are keyed by them (an orphaned edit is simply ignored).

## Data model (first version)

- `weeks` (migration 0003): id, start and end date (unique start), status, Home summary, standard and signature text, dining note, featured flag, published flag. The long and short date labels and the status label are derived in `src/lib/weeks.ts`, so the enquiry option text can never drift from the dates.
- `articles`: slug, order, eyebrow, kicker, title, hero media id, lede, Markdown body, next slug and label, published flag.
- `page_blocks` (migration 0006): page id, block key, kind, value (text, Markdown or media id), who and when. Only edited blocks are stored; defaults live in code.
- `media`: R2 key, file name, type, size, alt text, upload details.
- `enquiries`: the enquiry fields, received time, status, notes.
- `audit_log`: who, when, what changed.
- `accounts`, `account_identities`, `account_answers`, `account_tokens` (migration 0008): guests and admins, their profile answers and sign-ins. See `docs/accounts.md`. `admin_users` (migration 0002) is no longer read.

## Customers (T-33)

`/admin/customers` lists every account and the sheets the team has started; each customer sheet shows what the guest told us, lets the team add to it, links their enquiries, holds team notes and sets the role. Saving a sheet does not purge the page cache. Design: `docs/accounts.md`.

## Phases

1. **Foundation (T-21):** D1, password sign-in, admin shell, audit log. R2 moves to phase 4, and each phase seeds its own data.
2. **Availability weeks (T-22):** editor; `/availability`, the Home preview and the enquiry form's date options read from D1. Past weeks hidden from the site automatically (based on the start date, not a scheduled release).
3. **Enquiries inbox (T-23):** `D1Sink`, list and detail views, status and notes. Needs the privacy policy to name the retention period (D-13).
4. **Journal articles and media (T-24):** article editor with Markdown preview; image uploads to R2.
5. **Page copy and images (T-25):** keyed blocks for every page, edited in place on a preview of the page.
