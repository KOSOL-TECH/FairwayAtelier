# Development

The production site is an Astro + TypeScript project at the repo root. `prototype/` and the rest of `docs/` are the design reference and are not shipped.

## Commands

```bash
npm install
npm run dev         # http://localhost:4321
npm run build       # astro check + build into dist/
npm run preview     # serve the production build locally in workerd (Cloudflare's runtime)
npm test            # unit tests (Vitest): enquiry validation, consent expiry
npm run deploy      # build and deploy to Cloudflare Workers (run `npx wrangler login` first)
npm run cf-typegen  # regenerate worker-configuration.d.ts after changing wrangler.jsonc
```

## Structure

| Path | What it holds |
|---|---|
| `src/pages/` | One file per route; `api/enquiry.ts` is the only server-rendered route |
| `src/layouts/BaseLayout.astro` | `<head>` (title, meta, canonical, OG/Twitter, JSON-LD), header, footer, consent |
| `src/components/ui/` | Design-system components (same props as `prototype/components`) |
| `src/components/islands/` | React islands: `CookieConsent`, `EnquiryForm`, `JourneyTiers`, `Testimonials` |
| `src/lib/weeks.ts` | Opened weeks, stored in D1 and edited at `/admin/weeks`: feeds `/availability`, the Home preview and the enquiry date options |
| `src/content/journal/*.md` | The three journal articles |
| `src/styles/` | Tokens (copied from the prototype), fonts, base, layout primitives, component CSS |
| `src/lib/site.ts` | Per-route META, nav, sitemap entries, TravelAgency JSON-LD, Atout France number |
| `src/lib/enquiry/` | Shared validation, the sink interface, rate limit |
| `wrangler.jsonc` | Cloudflare Worker config: name, rate limiter, asset handling |

Everything except `/api/enquiry` is prerendered to static HTML. Only the header menu (a small inline script), the cookie banner, the enquiry form, the Journey tier tabs and the Home testimonials ship client JS. The FAQ and availability accordions are native `<details>`.

## Editing content

- **Availability:** in the admin at `/admin/weeks`; changes are live at once. `/availability` and `/enquire` render on each request, and the Home list is a server island (`src/components/Departures.astro`, `server:defer`), so Home itself stays prerendered. Only published weeks whose first day has not passed (Paris time) are shown. Weeks marked for Home appear there. Every shown week that is not `sold` becomes an option in the enquiry form, and the server validates against the same list.
- **Articles:** edit `src/content/journal/<slug>.md`. A `>` blockquote in the body renders as the pull quote.

## Admin

`/admin` is the private content tool (email and password sign-in, D1 database). See [admin.md](admin.md) for its design, local setup and migrations.

## Enquiry endpoint

`POST /api/enquiry` (JSON) validates with the same rules as the form and rejects a filled honeypot (`company`) silently. It also rate-limits to 5 requests per 60 seconds per IP through the Workers rate-limiting binding `ENQUIRY_LIMITER` (`wrangler.jsonc`). Accepted enquiries pass through every `EnquirySink` returned by `getEnquirySinks()` in `src/lib/enquiry/handler.ts`. They are, in order:

1. `ConsoleSink` logs the enquiry with the email and phone redacted (visible in the Worker's logs in the Cloudflare dashboard).
2. `TeamNotificationEmail` (`src/lib/enquiry/email.ts`) emails every field to atelier@fairwayatelier.com, with the guest as Reply-To, so replying answers the guest. If it fails, the request fails.
3. `GuestConfirmationEmail` confirms receipt to the guest. A failure is logged but does not fail the request: the team already has the enquiry, and a retry would send them a duplicate.

Both emails go out through the Cloudflare Email Service binding `EMAIL` (`wrangler.jsonc`), from atelier@fairwayatelier.com, so no API key is needed. The domain must be onboarded under **Email Service → Email Sending** in the dashboard (or with `npx wrangler email sending enable fairwayatelier.com`). Sending to guests, who are not verified addresses, needs the Workers Paid plan. Without the binding (`astro dev`) only `ConsoleSink` runs. Run `npm run cf-typegen` after changing bindings.

The CRM is still to come (BACKLOG T-05). Add it as another sink in `getEnquirySinks()`. A sink that throws makes the form show its error state and keeps the guest's input. API keys go in as secrets (`npx wrangler secret put NAME`, or `.dev.vars` locally) and are read with `import { env } from 'cloudflare:workers'`.

## Analytics

Nothing loads until the guest accepts analytics, and nothing loads at all while `PUBLIC_ANALYTICS_SRC` is empty (see `.env.example`). Set it, plus `PUBLIC_ANALYTICS_DOMAIN` for Plausible, once a provider is chosen.

## Hosting (Cloudflare Workers)

The site deploys as one Cloudflare Worker using `@astrojs/cloudflare`. The prerendered pages are served as static assets at no cost, and only `/api/enquiry` runs Worker code. The free Workers plan covers launch traffic. The paid plan (about $5 a month) is the step up if function requests ever pass the free daily allowance.

- **URLs:** `html_handling: "drop-trailing-slash"` in `wrangler.jsonc` keeps every URL matching its canonical (`/journal`, not `/journal/`); trailing-slash and `.html` variants redirect.
- **Images** are optimised with Sharp at build time (`imageService: 'compile'`), so no Cloudflare Images subscription is needed.
- **Sessions** are disabled (`session: false`), so no KV namespace is created.
- **Domains:** the Worker serves `fairwayatelier.com` and `www.fairwayatelier.com` as custom domains (`routes` in `wrangler.jsonc`); the `workers.dev` address and preview URLs are off. A zone Redirect Rule sends `www` to the apex and Always Use HTTPS is on; both live in the Cloudflare dashboard.
- **Continuous deploys:** Cloudflare Workers Builds deploys every push to `main`. Build command `npm test && npm run build`, deploy command `npx wrangler deploy`, Node version from `.node-version`. A failing test or `astro check` stops the deploy.
- **CI:** `.github/workflows/ci.yml` runs the tests and the build on every push and pull request, so other branches are checked before they reach `main`.
- **Manual deploy:** `npx wrangler login`, then `npm run deploy`. Always use `npm run deploy` (not a bare `wrangler deploy`) after changing `wrangler.jsonc`: Astro copies the config into `dist/` at build time.
- **Spam:** Cloudflare Turnstile can be added to the form later if the honeypot and rate limit are not enough.
