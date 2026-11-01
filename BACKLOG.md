# Fairway Atelier — Backlog

Single source of truth for all Fairway Atelier work. **Every agent and contributor checks this file before starting a task and updates it when done** (see "How to update" at the bottom).

**Owner** says who can move an item: **Client** (a business, legal or account decision only the client can make), **Dev** (code or config in this repo), or **Client + Dev** (the client decides or supplies something, then Dev implements). **Blocked by** names the item that must close first.

---

## Decisions needed (Client)

| ID | Decision | Notes |
|---|---|---|
| D-01 | Transactional email provider | Needed for the team notification to atelier@fairwayatelier.com and the guest confirmation. Cloudflare Email Sending fits the current hosting; Resend or Postmark also work from a Worker. |
| D-02 | CRM vendor | Enquiries must be pushed to it. Pick one with an HTTP API usable from a Worker. |
| D-03 | Analytics provider | Plausible, Fathom or Matomo. No Google Analytics. Already gated behind consent; only `PUBLIC_ANALYTICS_SRC` / `PUBLIC_ANALYTICS_DOMAIN` need setting. |
| D-04 | Journal cards without articles | The featured "Why we chose Brittany" and the four post cards on `/journal` have no articles behind them and are not links. Write them, link them to the existing three articles, or remove them. |
| D-05 | Legal pages in robots.txt vs sitemap | `robots.txt` disallows the four legal pages, but the sitemap lists them (both as in the prototype). Recommendation: drop them from the sitemap. |
| D-06 | Add Cloudflare Turnstile to the enquiry form? | Today: honeypot + rate limit (5/min/IP). Turnstile is free and adds stronger bot protection. |
| D-07 | Sign off copy and design deviations | Copy written in development (no source copy existed): "Sending…" button state, send-failure message, skip link, 404 page. Design: footer legal row opacity 0.55 instead of 0.5 (WCAG AA contrast); form clears after a successful send. |
| D-08 | Mailbox for atelier@fairwayatelier.com | The domain has no MX or SPF records (checked 2026-11-01), so the address the site publishes can't receive mail. Pick a mailbox host (Google Workspace, Microsoft 365, or Cloudflare Email Routing to forward to an existing inbox). The existing DMARC record is `p=quarantine`, so outgoing mail also needs SPF and DKIM. |

## To do

| ID | Task | Owner | Blocked by | Notes |
|---|---|---|---|---|
| T-03 | Continuous deploys from GitHub | Dev | — | Workers & Pages → Import repository; build `npm run build`, deploy `npx wrangler deploy`. |
| T-04 | Enquiry emails (team notification + guest confirmation) | Dev | D-01 | Add `EnquirySink` implementations in `src/lib/enquiry/handler.ts`; keys via `wrangler secret put`. |
| T-05 | Push enquiries to the CRM | Dev | D-02 | Another `EnquirySink`. |
| T-06 | Wire up analytics | Dev | D-03 | Set env vars; update the cookie policy's cookie table. |
| T-07 | Add Turnstile to the enquiry form | Dev | D-06 | Client widget + server-side Siteverify in `/api/enquiry`. |
| T-08 | Legal pages ready for launch | Client | — | Fill every `[bracketed]` field (RCS/SIREN, VAT, share capital, insurer, financial guarantor, deposit %, dates, DPO contact). Host is now Cloudflare, Inc., so the "All servers are located within the European Union" sentence must change. French counsel sign-off. |
| T-09 | Atout France registration number | Client | — | Placeholder `IM0XX2600XX`; set once in `src/lib/site.ts` (`ATOUT_FRANCE`). |
| T-10 | Licensed photography | Client + Dev | — | Replace the low-res brand-sheet crops in `src/assets/` with licensed hotel, course and dining photos; Astro outputs responsive WebP/AVIF. |
| T-11 | SVG logo, wordmark and crest | Client + Dev | — | Request from the client; replace the PNGs. |
| T-12 | Lighthouse audit (≥95 performance, accessibility, SEO) | Dev | — | Run against the deployed site, fix findings. |
| T-13 | Real-device testing | Dev | — | iOS Safari and Android Chrome: menu, consent banner, form, dialog, tabs. |
| T-14 | Automated tests and CI build check | Dev | — | Unit tests for the enquiry validator and consent expiry; run `npm run build` (includes `astro check`) on every push. |
| T-18 | Force HTTPS and redirect www to the apex | Dev | — | http://fairwayatelier.com serves the page instead of redirecting: turn on SSL/TLS → Edge Certificates → Always Use HTTPS. www serves a duplicate (canonical tag points to the apex); add a Redirect Rule www → https://fairwayatelier.com (301, keep path). |
| T-17 | Set up email DNS for fairwayatelier.com | Client + Dev | D-08, D-01 | MX for the chosen mailbox host, SPF, DKIM for the sending provider; review the DMARC policy. Must be done before launch. |

## In progress

_Nothing in progress._

## Done

| ID | Task | Completed | Notes |
|---|---|---|---|
| X-01 | Astro + TypeScript scaffold, handoff package committed as reference | 2026-11-01 | `prototype/` and `docs/` kept, not shipped. |
| X-02 | Tokens, self-hosted fonts, UI components with prototype props | 2026-11-01 | `src/styles/`, `src/components/ui/`. |
| X-03 | All 16 routes, copy verbatim | 2026-11-01 | Plus a 404 page. |
| X-04 | Per-page SEO, JSON-LD, sitemap.xml, robots.txt | 2026-11-01 | `src/lib/site.ts`, `src/layouts/BaseLayout.astro`. |
| X-05 | Responsive layouts (960 / 620 px), hamburger at 1000 px | 2026-11-01 | |
| X-06 | CNIL cookie consent, scroll reveal | 2026-11-01 | 6-month re-prompt; footer "Cookie settings". |
| X-07 | Enquiry form, validation, stubbed endpoint | 2026-11-01 | `ConsoleSink` only until T-04 / T-05. |
| X-08 | Move hosting to Cloudflare Workers | 2026-11-01 | Rate-limit binding, drop-trailing-slash, `npm run deploy`. |
| X-09 | Cloudflare agent tooling | 2026-11-01 | Claude Code plugin (skills + MCP) and `cf` CLI installed and signed in on the developer machine. |
| X-10 | Project backlog and agent rules | 2026-11-01 | `BACKLOG.md`; `CLAUDE.md` and `AGENTS.md` require every agent to check and update it. |
| X-11 | First deploy to Cloudflare Workers (was T-01) | 2026-11-01 | Live at https://fairway-atelier.fairway-atelier.workers.dev (version fb582578). Needed the account email verified first. Checked: pages 200, /journal/ redirects to /journal, 404 page, sitemap, robots, and /api/enquiry validation (422). |
| X-12 | Connect fairwayatelier.com (was T-02) | 2026-11-01 | Nameservers moved from GoDaddy to Cloudflare (felipe/joselyn); GoDaddy parking A records and www CNAME deleted; apex and www are Worker custom domains in `wrangler.jsonc`. Checked: pages, 404, sitemap, robots, enquiry API on https://fairwayatelier.com. Note: `npm run deploy` (not bare `wrangler deploy`) after config changes, since Astro copies the config into `dist/`. |
| X-13 | Disable workers.dev and preview URLs (was T-16) | 2026-11-01 | `workers_dev: false`, `preview_urls: false` in `wrangler.jsonc`; the workers.dev address now returns 404. |

## Closed (not done)

Items the client chose not to pursue for now. Move a row back to **To do** to re-open it.

| ID | Task | Closed | Notes |
|---|---|---|---|
| T-15 | Enable 2FA on the Cloudflare account | 2026-11-01 | Client decision: not for now; may re-open later. |

---

## How to update

- **Before starting:** read this file. If the task is listed, move its row to **In progress** and add your name or agent session to Notes. If it is not listed, add it to **To do** with the next free `T-` number first.
- **When done:** move the row to **Done**, give it the next free `X-` number, add the completion date (YYYY-MM-DD) and a short note on what changed (files, commands, anything left over).
- **New work discovered along the way:** add it to **To do** (or to **Decisions needed** if only the client can decide), with an owner and any blocker.
- **Decisions:** when the client decides, record the answer in the item's Notes, then move or unblock the tasks that depended on it.
- Commit backlog changes together with the work they describe.
