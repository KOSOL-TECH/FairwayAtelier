# Development

The production site is an Astro + TypeScript project at the repo root. `prototype/` and the rest of `docs/` are the design reference and are not shipped.

## Commands

```bash
npm install
npm run dev         # http://localhost:4321
npm run build       # astro check + build into dist/
npm run preview     # serve the production build locally in workerd (Cloudflare's runtime)
npm test            # unit tests (Vitest)
npm run test:coverage  # the same, with a coverage report
npm run deploy      # build and deploy to Cloudflare Workers (run `npx wrangler login` first)
npm run cf-typegen  # regenerate worker-configuration.d.ts after changing wrangler.jsonc
```

## Structure

| Path | What it holds |
|---|---|
| `src/pages/` | One file per route, all rendered on demand in the Worker |
| `src/middleware.ts` | Refuses cross-site writes, resolves the signed-in account, guards `/account` and `/admin`, edge-cache rules for public pages, purge after admin changes |
| `src/lib/account/` | Guest accounts: profile questions, sessions, sign-in (email, Google, Apple), the D1 store, emails. Design in [accounts.md](accounts.md) |
| `src/pages/join.astro`, `sign-in.astro`, `account/`, `auth/`, `api/account/` | Onboarding, sign-in, the guest profile and its APIs. Never cached |
| `src/lib/copy.ts`, `src/lib/pages/` | Editable page copy: approved originals in code, edits in D1 (`/admin/pages`) |
| `src/layouts/BaseLayout.astro` | `<head>` (title, meta, canonical, OG/Twitter, JSON-LD), header, footer, consent |
| `src/components/ui/` | Design-system components (same props as `prototype/components`) |
| `src/components/islands/` | React islands: `CookieConsent`, `EnquiryForm`, `JourneyTiers`, `Testimonials`, and for accounts `JoinFlow`, `ProfileEditor`, `ProfilePrompt` |
| `src/lib/weeks.ts` | Opened weeks, stored in D1 and edited at `/admin/weeks`: feeds `/availability`, the Home preview and the enquiry date options |
| `src/lib/articles.ts`, `src/lib/media.ts` | Journal articles and the media library, stored in D1 and R2 and edited at `/admin/journal` and `/admin/media` |
| `src/styles/` | Tokens (copied from the prototype), fonts, base, layout primitives, component CSS |
| `src/lib/site.ts` | Per-route META, nav, sitemap entries, TravelAgency JSON-LD, Atout France number |
| `src/lib/enquiry/` | Shared validation, the sink interface, rate limit |
| `wrangler.jsonc` | Cloudflare Worker config: name, rate limiter, asset handling |

Every page renders on demand, so edits made in the admin (D1) show without a rebuild. Public pages are then kept in Cloudflare's Worker cache (`"cache": { "enabled": true }` in `wrangler.jsonc`, Astro route caching with `cacheCloudflare()` in `astro.config.mjs`). `src/middleware.ts` gives them one hour fresh plus a day of stale-while-revalidate, tagged `content`. Every POST in the admin purges that tag, so edits still show at once. Each deploy starts with an empty cache. If D1 cannot be read, `loadPage` falls back to the approved originals (without content photos), and the Home week list falls back to its empty state. Only the header menu (a small inline script), the cookie banner, the enquiry form, the Journey tier tabs and the Home testimonials ship client JS. The FAQ and availability accordions are native `<details>`.

## Editing content

- **Availability:** in the admin at `/admin/weeks`; changes are live at once. `/availability`, `/enquire` and the Home list (`src/components/Departures.astro`) read the weeks from D1; an admin change purges the cached pages. Only published weeks whose first day has not passed (Paris time) are shown. Weeks marked for Home appear there. Every shown week that is not `sold` becomes an option in the enquiry form, and the server validates against the same list.
- **Articles:** in the admin at `/admin/journal` (Markdown body; a `>` blockquote renders as the pull quote; raw HTML is shown as text). `/journal`, `/journal/<slug>` and `/sitemap.xml` render on each request, so published articles appear at once. Unknown or draft slugs get the site's 404 page (`src/lib/not-found.ts`).
- **Images:** upload at `/admin/media`. Files live in the R2 bucket `fairway-atelier-media` (binding `MEDIA`) and are served from `/media/<id>?w=<width>`, resized and converted to AVIF/WebP by the Images binding (`IMAGES`) and cached at the edge. Only six widths are allowed (`WIDTHS` in `src/lib/media.ts`), which keeps resizing inside the 5,000 free transformations a month. Use `src/components/MediaImage.astro` to show one.

## Admin

`/admin` is the private content tool and CRM (D1 database), open to accounts with the admin role. See [admin.md](admin.md) for its design, local setup and migrations, and [accounts.md](accounts.md) for guest profiles, sign-in and the Google/Apple setup.

## Enquiry endpoint

`POST /api/enquiry` (JSON) validates with the same rules as the form and rejects a filled honeypot (`company`) silently. It also rate-limits to 5 requests per 60 seconds per IP through the Workers rate-limiting binding `ENQUIRY_LIMITER` (`wrangler.jsonc`). Accepted enquiries pass through every `EnquirySink` returned by `getEnquirySinks()` in `src/lib/enquiry/handler.ts`. They are, in order:

1. `ConsoleSink` logs the enquiry with the email and phone redacted (visible in the Worker's logs in the Cloudflare dashboard).
2. `D1Sink` (`src/lib/enquiry/store.ts`) stores it for the admin inbox before any email goes out.
3. `TeamNotificationEmail` (`src/lib/enquiry/email.ts`) emails every field to atelier@fairwayatelier.com, with the guest as Reply-To, so replying answers the guest. If it fails, the request fails, so the guest can retry.
4. `GuestConfirmationEmail` confirms receipt to the guest. A failure is logged but does not fail the request: the team already has the enquiry, and a retry would send them a duplicate.

The form sends one random `id` (UUID) per enquiry. A retry after a failed send reuses it, so `D1Sink` updates the stored enquiry (while it is still New) instead of adding a second one. Requests over 16 KB are refused with 413.

Both emails go out through the Cloudflare Email Service binding `EMAIL` (`wrangler.jsonc`), from atelier@fairwayatelier.com, so no API key is needed. The domain must be onboarded under **Email Service → Email Sending** in the dashboard (or with `npx wrangler email sending enable fairwayatelier.com`). Sending to guests, who are not verified addresses, needs the Workers Paid plan. Without the binding (`astro dev`) only `ConsoleSink` runs. Run `npm run cf-typegen` after changing bindings.

The CRM is still to come (BACKLOG T-05). Add it as another sink in `getEnquirySinks()`. A sink that throws makes the form show its error state and keeps the guest's input. API keys go in as secrets (`npx wrangler secret put NAME`, or `.dev.vars` locally) and are read with `import { env } from 'cloudflare:workers'`.

## Analytics

Nothing loads until the guest accepts analytics, and nothing loads at all while `PUBLIC_ANALYTICS_SRC` is empty (see `.env.example`). Set it, plus `PUBLIC_ANALYTICS_DOMAIN` for Plausible, once a provider is chosen.

## Hosting (Cloudflare Workers)

The site deploys as one Cloudflare Worker using `@astrojs/cloudflare`. Pages render in the Worker and are served from the Worker cache between admin changes (see Structure). Hashed build assets (`/_astro/*`) are served as static assets at no cost. The account is on the Workers Paid plan (D-10).

- **URLs:** `html_handling: "drop-trailing-slash"` in `wrangler.jsonc` keeps every URL matching its canonical (`/journal`, not `/journal/`); trailing-slash and `.html` variants redirect.
- **Images:** brand graphics in `src/assets` resize through the `IMAGES` binding at runtime; media-library photos go through `/media/<id>` (see Editing content).
- **Sessions** are disabled (`session: false`), so no KV namespace is created.
- **Domains:** the Worker serves `fairwayatelier.com` and `www.fairwayatelier.com` as custom domains (`routes` in `wrangler.jsonc`); the `workers.dev` address and preview URLs are off. A zone Redirect Rule sends `www` to the apex and Always Use HTTPS is on; both live in the Cloudflare dashboard.
- **Continuous deploys:** Cloudflare Workers Builds deploys every push to `main`. Build command `npm test && npm run build`, deploy command `npx wrangler deploy`, Node version from `.node-version`. A failing test or `astro check` stops the deploy.
- **CI:** `.github/workflows/ci.yml` runs the tests and the build on every push and pull request, so other branches are checked before they reach `main`.
- **Manual deploy:** `npx wrangler login`, then `npm run deploy`. Always use `npm run deploy` (not a bare `wrangler deploy`) after changing `wrangler.jsonc`: Astro copies the config into `dist/` at build time.
- **Spam:** Cloudflare Turnstile can be added to the form later if the honeypot and rate limit are not enough.
