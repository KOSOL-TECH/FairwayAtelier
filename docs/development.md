# Development

The production site is an Astro + TypeScript project at the repo root. `prototype/` and the rest of `docs/` are the design reference and are not shipped.

## Commands

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # astro check + build into dist/
npm run preview   # serve the production build (Node adapter)
```

## Structure

| Path | What it holds |
|---|---|
| `src/pages/` | One file per route; `api/enquiry.ts` is the only server-rendered route |
| `src/layouts/BaseLayout.astro` | `<head>` (title, meta, canonical, OG/Twitter, JSON-LD), header, footer, consent |
| `src/components/ui/` | Design-system components (same props as `prototype/components`) |
| `src/components/islands/` | React islands: `CookieConsent`, `EnquiryForm`, `JourneyTiers`, `Testimonials` |
| `src/content/availability.json` | Opened weeks: feeds `/availability`, the Home preview and the enquiry date options |
| `src/content/journal/*.md` | The three journal articles |
| `src/styles/` | Tokens (copied from the prototype), fonts, base, layout primitives, component CSS |
| `src/lib/site.ts` | Per-route META, nav, sitemap entries, TravelAgency JSON-LD, Atout France number |
| `src/lib/enquiry/` | Shared validation, the sink interface, rate limit |

Everything except `/api/enquiry` is prerendered to static HTML. Only the header menu (a small inline script), the cookie banner, the enquiry form, the Journey tier tabs and the Home testimonials ship client JS. The FAQ and availability accordions are native `<details>`.

## Editing content

- **Availability:** edit `src/content/availability.json`. `status` is one of `booking | limited | sold | waitlist`. Weeks with `featured: true` appear on Home. Every week that is not `sold` becomes an option in the enquiry form (server validation uses the same list).
- **Articles:** edit `src/content/journal/<slug>.md`. A `>` blockquote in the body renders as the pull quote.

## Enquiry endpoint

`POST /api/enquiry` (JSON) validates with the same rules as the form, rejects a filled honeypot (`company`) silently, and rate-limits to 5 requests per 10 minutes per IP. Accepted enquiries pass through every `EnquirySink` returned by `getEnquirySinks()` in `src/lib/enquiry/handler.ts`. Today that is only `ConsoleSink`, which logs with the email and phone redacted.

To go live, add sinks for the team notification email, the guest confirmation and the CRM, and return them from `getEnquirySinks()`. A sink that throws makes the form show its error state and keeps the guest's input.

## Analytics

Nothing loads until the guest accepts analytics, and nothing loads at all while `PUBLIC_ANALYTICS_SRC` is empty (see `.env.example`). Set it, plus `PUBLIC_ANALYTICS_DOMAIN` for Plausible, once a provider is chosen.

## Hosting

`astro.config.mjs` uses `@astrojs/node` (standalone) because the enquiry route needs a server. If the site goes to Netlify, Vercel or Cloudflare, swap the adapter. The rate limiter is in-memory, so on serverless it should move to the platform's KV or edge rate limiting, or be replaced by Cloudflare Turnstile.
