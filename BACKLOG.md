# Fairway Atelier — Backlog

Single source of truth for all Fairway Atelier work. **Every agent and contributor checks this file before starting a task and updates it when done** (see "How to update" at the bottom).

**Owner** says who can move an item: **Client** (a business, legal or account decision only the client can make), **Dev** (code or config in this repo), or **Client + Dev** (the client decides or supplies something, then Dev implements). **Blocked by** names the item that must close first.

---

## Decisions needed (Client)

| ID | Decision | Notes |
|---|---|---|
| D-02 | CRM vendor | Enquiries must be pushed to it. Pick one with an HTTP API usable from a Worker. |
| D-03 | Analytics provider | Plausible, Fathom or Matomo. No Google Analytics. Already gated behind consent; only `PUBLIC_ANALYTICS_SRC` / `PUBLIC_ANALYTICS_DOMAIN` need setting. |
| D-04 | Journal cards without articles | The featured "Why we chose Brittany" and the four post cards on `/journal` have no articles behind them and are not links. Write them, link them to the existing three articles, or remove them. |
| D-05 | Legal pages in robots.txt vs sitemap | `robots.txt` disallows the four legal pages, but the sitemap lists them (both as in the prototype). Recommendation: drop them from the sitemap. |
| D-06 | Add Cloudflare Turnstile to the enquiry form? | Today: honeypot + rate limit (5/min/IP). Turnstile is free and adds stronger bot protection. |
| D-07 | Sign off copy and design deviations | Copy written in development (no source copy existed): "Sending…" button state, send-failure message, skip link, 404 page. Design: footer legal row opacity 0.55 instead of 0.5 (WCAG AA contrast); form clears after a successful send. Added 2026-11-01 for WCAG AA (found by the Lighthouse audit): primary buttons use cream text instead of charcoal on the same green; small brass text uses a deeper brass `#85663B` (lines and fills keep `#A07B47`); muted text darkened to `#6F6B5F`; form fields use 16px text on phones (stops iPhone zoom); the cookie-policy link in the banner is underlined. Added 2026-11-01 for T-04: the enquiry emails in `src/lib/enquiry/email.ts`. The guest confirmation reuses the approved Thank-you dialog wording; new are the subjects ("Your enquiry with Fairway Atelier", "New enquiry: name (dates)"), the "For your records" recap line, "If anything changes in the meantime, simply reply to this email." and the sign-off. |
| D-09 | Cloudflare Web Analytics beacon | Cloudflare injects its cookieless analytics script (`static.cloudflareinsights.com/beacon.min.js`) into every page, without asking for consent. The cookie policy says analytics only run with consent. Keep it (it sets no cookies) and update the policy, or turn it off: dashboard → Analytics & Logs → Web Analytics → fairwayatelier.com. The API shows the zone setting as off, so it was likely switched on in the dashboard. |

## To do

| ID | Task | Owner | Blocked by | Notes |
|---|---|---|---|---|
| T-05 | Push enquiries to the CRM | Dev | D-02 | Another `EnquirySink`. |
| T-06 | Wire up analytics | Dev | D-03 | Set env vars; update the cookie policy's cookie table. |
| T-07 | Add Turnstile to the enquiry form | Dev | D-06 | Client widget + server-side Siteverify in `/api/enquiry`. |
| T-10 | Licensed photography | Client + Dev | — | Replace the low-res brand-sheet crops in `src/assets/` with licensed hotel, course and dining photos; Astro outputs responsive WebP/AVIF. |
| T-11 | SVG logo, wordmark and crest | Client + Dev | — | Request from the client; replace the PNGs. |
| T-13 | Real-device testing | Client + Dev | — | Emulated-phone checks done 2026-11-01 (layout, menu, banner, form validation, tabs; found and fixed iPhone zoom on form fields). Remaining: run `docs/device-testing.md` on a real iPhone and Android phone, including one real test enquiry to see the Thank-you dialog. |
| T-19 | DMARC reports address | Client + Dev | — | DMARC is `p=quarantine; adkim=r; aspf=r`, and reports go to a leftover GoDaddy address (`dmarc_rua@onsecureserver.net`) nobody reads. Point `rua` at an address the client reads, or drop it. Also check one delivered enquiry email's headers for `dmarc=pass`. |
| T-20 | Reply from atelier@ in Gmail | Client | — | Replies from Gmail still come from valgreskai@gmail.com. Optional: set up Gmail "Send mail as" atelier@ (needs an SMTP relay, since Email Sending has no SMTP). |

## In progress

_Nothing in progress._

## Decisions recorded

| ID | Decision | Answer |
|---|---|---|
| D-01 | Transactional email provider | 2026-11-01: Cloudflare Email Sending (binding `EMAIL`, no API key). |
| D-10 | Upgrade to the Workers Paid plan ($5/month) | 2026-11-01: upgraded. Needed for Email Sending to reach guests; includes 3,000 emails/month, then $0.35 per 1,000. |

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
| X-14 | Force HTTPS and redirect www to the apex (was T-18) | 2026-11-01 | Zone setting Always Use HTTPS on; Redirect Rule "Redirect www to apex" (301, keeps path and query) in the zone's dynamic redirect phase. Both live in the Cloudflare dashboard, not in this repo. Checked: http and www URLs reach https://fairwayatelier.com in one hop. |
| X-15 | Receive mail at atelier@fairwayatelier.com (D-08) | 2026-11-01 | Client decision: forward to valgreskai@gmail.com for now. Cloudflare Email Routing enabled (MX route1-3.mx.cloudflare.net, SPF `include:_spf.mx.cloudflare.net`, DKIM `cf2024-1`); destination verified; rule "atelier@ to valgreskai". Configured in the Cloudflare dashboard, not this repo. Other addresses at the domain are not routed (no catch-all). |
| X-16 | Automated tests and CI build check (was T-14) | 2026-11-01 | Vitest (`npm test`): 19 tests for enquiry validation/normalisation and consent expiry/storage (`src/lib/**/*.test.ts`). `.github/workflows/ci.yml` runs tests + build (incl. `astro check`) on every push and PR, Node from `.node-version`. |
| X-17 | Lighthouse audit and fixes (was T-12) | 2026-11-01 | 10 live pages, mobile + desktop. After fixes: accessibility, best practices and SEO 100 everywhere; performance 96–100 (mobile LCP 2.2–2.8 s, mostly the cookie banner on first visit). Fixed: colour contrast (see D-07), heading order on Home and Private, link-in-text in the banner, limited badge on Availability. Not fixed (minor): logo/crest images a few KB larger than needed, React runtime unused-JS hint, render-blocking CSS hint, the Cloudflare beacon (D-09). |
| X-18 | Continuous deploys from GitHub (was T-03) | 2026-11-01 | Cloudflare Workers Builds connected to KOSOL-TECH/FairwayAtelier: every push to `main` runs `npm test && npm run build` then `npx wrangler deploy`; non-production branch builds off. Verified with commit a4bdacf: Workers Builds and GitHub CI both green, deployed as version 6dd92db0, live site checked. |
| X-19 | Email DNS for sending (was T-17) | 2026-11-01 | `npx wrangler email sending enable fairwayatelier.com` (after the Workers Paid upgrade, D-10). Cloudflare added MX, SPF and DKIM on `cf-bounce.fairwayatelier.com` only, so the apex SPF (Email Routing) and the existing DMARC record are unchanged. The domain was ready about 1 minute later; a Wrangler test send to atelier@ was queued. DMARC follow-up in T-19. |
| X-20 | Enquiry emails: team notification + guest confirmation (was T-04) | 2026-11-01 | Cloudflare Email Sending (D-01) through the `EMAIL` binding, from atelier@fairwayatelier.com. `src/lib/enquiry/email.ts` + 6 tests; wired in `getEnquirySinks()`. Deployed in commit 1429cf2 (version 9d42d9d2). A live test enquiry (name "Test Enquiry (Claude)", guest address atelier@) returned 200, so the team send was accepted. Both emails confirmed arriving in the valgreskai@gmail.com inbox (client, 2026-11-01). New email copy is listed in D-07 for sign-off. |

## Closed (not done)

Items the client chose not to pursue for now. Move a row back to **To do** to re-open it.

| ID | Task | Closed | Notes |
|---|---|---|---|
| T-15 | Enable 2FA on the Cloudflare account | 2026-11-01 | Client decision: not for now; may re-open later. |
| T-08 | Legal pages ready for launch | 2026-11-01 | Parked by the client until further notice; re-open on their say-so. Still needed before launch: Fill every `[bracketed]` field (RCS/SIREN, VAT, share capital, insurer, financial guarantor, deposit %, dates, DPO contact). Host is now Cloudflare, Inc., so the "All servers are located within the European Union" sentence must change. French counsel sign-off. |
| T-09 | Atout France registration number | 2026-11-01 | Parked by the client until further notice; re-open on their say-so. Still needed before launch: Placeholder `IM0XX2600XX`; set once in `src/lib/site.ts` (`ATOUT_FRANCE`). |

---

## How to update

- **Before starting:** read this file. If the task is listed, move its row to **In progress** and add your name or agent session to Notes. If it is not listed, add it to **To do** with the next free `T-` number first.
- **When done:** move the row to **Done**, give it the next free `X-` number, add the completion date (YYYY-MM-DD) and a short note on what changed (files, commands, anything left over).
- **New work discovered along the way:** add it to **To do** (or to **Decisions needed** if only the client can decide), with an owner and any blocker.
- **Decisions:** when the client decides, record the answer in the item's Notes, then move or unblock the tasks that depended on it.
- Commit backlog changes together with the work they describe.
