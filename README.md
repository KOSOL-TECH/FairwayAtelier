# Handoff: Fairway Atelier marketing website

## Overview
Fairway Atelier is a bespoke luxury golf travel operator on the Emerald Coast of Brittany, France (Dinard). The site is **enquiry-first**: there is no online booking or payment. The main conversion is a qualified enquiry that leads to a 30–45 minute consultation call.

The core differentiator is the walletless, touchless promise: *"You will never see a bill during your trip."*

There are two hotel tiers, both **priced on request**, and flights are excluded:
- **Standard**: EMERIA Dinard Hôtel Thalasso & Spa
- **Signature**: Hôtel Barrière Le Grand Hôtel Dinard (Belle-Époque)

Target repo: `KOSOL-TECH/FairwayAtelier` (empty at handoff). Production domain: `https://fairwayatelier.com/`.

## About the design files
The files in `prototype/` are **design references built in HTML/React**. They show the intended look, copy and behaviour. They are not production code:
- JSX is transpiled in the browser by Babel standalone.
- Routing is a single `useState` switch in `app.jsx`, with no URLs.
- Responsive behaviour is applied by a global stylesheet that matches inline-style strings (`ResponsiveStyles.jsx`). This is a prototype hack; do not port it.

Recreate the designs in a proper framework. **Recommended: Astro + React islands.** The site is mostly static content, and only the header menu, cookie consent, enquiry form, tabs and dialog need client JS. Next.js (App Router, static export) is an acceptable alternative. Use TypeScript and CSS Modules or plain CSS with the provided tokens, real media queries, and one route per page.

To view the prototype, serve `prototype/` over HTTP (for example `npx serve prototype`) and open `/ui_kits/website/index.html`. Opening the file directly will not load the JSX.

## Fidelity
**High-fidelity.** Colours, type, spacing, copy and interactions are final. Recreate them pixel-accurately. All copy in the screen files is approved and should be used **verbatim**.

**Pricing:** the site shows "Priced on request" everywhere. `docs/brand-and-design-system.md` mentions USD price ranges from an earlier round. Those ranges are superseded; do not display them.

## Routes
| Route | Prototype key | Source file |
|---|---|---|
| `/` | Home | `HomeScreen.jsx` |
| `/experience` | Experience | `ExperienceScreen.jsx` |
| `/journey` | Journey | `JourneyScreen.jsx` |
| `/dining-and-golf` | DiningGolf | `ContentScreens.jsx` → `DiningGolfScreen` |
| `/availability` | Availability | `AvailabilityScreen.jsx` |
| `/private` | Private | `ContentScreens.jsx` → `PrivateScreen` |
| `/journal` | Journal | `ContentScreens.jsx` → `JournalScreen` |
| `/journal/coast` | Article:coast | `ArticleScreen.jsx` (The Golf) |
| `/journal/dining` | Article:dining | `ArticleScreen.jsx` (The Table) |
| `/journal/restore` | Article:restore | `ArticleScreen.jsx` (The Ease) |
| `/faq` | FAQ | `ContentScreens.jsx` → `FAQScreen` |
| `/enquire` | Enquire | `EnquireScreen.jsx` |
| `/mentions-legales` | MentionsLegales | `LegalScreen.jsx` |
| `/privacy` | Privacy | `LegalScreen.jsx` |
| `/terms` | Terms | `LegalScreen.jsx` (CGV) |
| `/cookies` | Cookies | `LegalScreen.jsx` |

Per-page `<title>` and meta descriptions are in the `META` object in `prototype/ui_kits/website/app.jsx`. Generate them server-side per route, along with canonical, Open Graph and Twitter tags (pattern in `index.html`). Add the three article URLs to `sitemap.xml`. Keep the TravelAgency JSON-LD in `index.html` on every page.

In the prototype, `onNav('X')` calls stand in for links. Replace each with a real `<a href>` to the route above.

## Global layout
- **Header** (`Header.jsx`): sticky, height 84px, cream background, 1px hairline bottom border, z-index 60. Content max-width 1200px with 40px side padding.
  - Wordmark image (24px tall) on the left, linking to `/`.
  - Nav: Home, Experience, Journey, Dining & Golf, Availability, Journal, Enquire. Links are Montserrat 12px, uppercase, 0.14em tracking, gap 26px. The active link is brass with a 1px brass underline.
  - **At ≤1000px**, the nav becomes a hamburger: three 24×1.5px bars, gap 5px. The top and bottom bars animate to an X with `translateY(±6.5px) rotate(±45deg)` over 150ms, and the middle bar fades out. The menu drops below the header as a stacked list of 15px links with 0.18em tracking and 14px vertical padding. It closes on navigation. Use `aria-expanded`.
- **Footer** (`Footer.jsx`): charcoal background. It must carry the French entity name and **Atout France registration number** on every page, plus the named-asset disclosure: "Named restaurants, hotels, and courses are illustrative. Final inclusions per trip are subject to availability and confirmed during the consultation call." It also links to the four legal pages.
- **Page body**: `main` blocks are full-width sections. Inner content max-width is usually 1120–1200px, with vertical section padding of 76–92px on desktop.

## Responsive behaviour (implement with real media queries)
- **Tablet, ≤960px**:
  - 3- and 4-column grids → 2 columns.
  - Two-column splits (`1fr 1fr`, `1.1fr …`) → 1 column.
  - The footer `2fr 1fr 1fr 1fr` grid → 2 columns.
  - Split-image min-height drops from 340px to 240px.
- **Mobile, ≤620px**:
  - Section, main, footer and header horizontal padding → 22px.
  - All multi-column grids → 1 column.
  - Availability rows (`1.4fr 1fr auto`) stack with an 8px gap.
  - Journal cards stack the image over the text, with a 200px minimum image height.
  - Decorative hero villa engraving shrinks from 420px to 200px wide at 0.32 opacity.
  - Section vertical padding compresses to about 56–60px.
- Display type is already fluid via `clamp()` tokens (see below).
- See `prototype/components/surfaces/ResponsiveStyles.jsx` for the full list of rules being emulated.

## Components (`prototype/components/`)
Each component has a `.jsx` file (reference implementation), a `.d.ts` (props API) and a `.prompt.md` (usage rules). Port them as real components with the same props.

- **Button**: variants `primary | secondary | ghost`, sizes `sm | md | lg`.
  - Padding: sm 10px 20px / md 14px 28px / lg 17px 36px.
  - Font size: 11 / 12 / 13px.
  - Text: Montserrat 600, uppercase, 0.22em tracking. Radius 0. Transitions 150ms.
  - Primary: background #5F735B with charcoal #2F3133 text. On hover the background goes to #495846 and the text to cream #F4F0E8.
  - Secondary: transparent with a 1px charcoal border. On hover the background is rgba(47,49,51,0.06).
  - Ghost: green text with a 1px brass bottom border and 4px 0 padding. On hover the text turns brass.
  - Disabled: opacity 0.45.
- **Eyebrow**: uppercase Montserrat label, 0.22em tracking, optional flanking brass rules (—— LABEL ——).
- **Divider**: brass or hairline rule.
- **Badge**: small status label. The pill radius is allowed here only. Availability statuses:
  - Booking: green
  - Limited: brass
  - Sold: charcoal
  - Waitlist: #8B8677
- **Form controls**: Input, Select, Checkbox, Radio and Switch. Uppercase 11px labels with 0.14em tracking, hairline borders, a brass focus ring of rgba(160,123,71,0.45), and an error message below the field. Set `aria-invalid` on fields with errors.
- **Card**: white surface with a hairline border and `--shadow-card`. On hover it lifts to `--shadow-lift`. A double-frame variant has 8px outer padding and a 1px brass inner border.
- **Tabs**: used for the Standard/Signature tier switch on the Journey page.
- **Dialog**: modal with eyebrow, title, body and action buttons. Used to confirm an enquiry.
- **Testimonial**: quotes section on Home.
- **CookieConsent**: see Interactions.
- **ScrollReveal**: see Interactions.

## Interactions & behaviour

### Enquiry form (`/enquire`, `EnquireScreen.jsx`)
The form must stay at 8 fields or fewer.
- **Fields:**
  - Full Name (required)
  - Email (required; validated with `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
  - Phone (optional)
  - Dates of Interest (required select). Options: 10–17 May 2026, 07–14 Jun 2026, 13–20 Sep 2026, 18–25 Oct 2026, "Flexible / not sure yet". Source these from the same data as `/availability`.
  - Group Composition (required select): Two travellers, Four travellers, "A larger private group (5–8)".
  - Tier Interest (radio): Standard, Signature, Undecided. Default is Undecided.
  - Anything we should know? (optional)
- **Validation:** errors appear on blur, or for every field after the first submit attempt. Messages, verbatim:
  - Name: "Please tell us your name."
  - Email, empty: "An email lets us reply."
  - Email, invalid: "Please check this email address."
  - Dates: "Choose a window, or “Flexible”."
  - Group: "Let us know who is travelling."
- **Failed submit:** show "Please complete the highlighted fields above." in brass above the button, and focus the first invalid field.
- **Successful submit:** open the Dialog (eyebrow "Received", title "Thank you") with the personalised message from the source file.
- **Production requirements:**
  - POST to a server endpoint with server-side validation.
  - Spam protection: honeypot plus rate limit, or Cloudflare Turnstile. No Google reCAPTCHA.
  - Send a notification email to `atelier@fairwayatelier.com` and a confirmation email to the guest.
  - Push the enquiry to the CRM (TBD with client).
  - Show loading and error states on the button. Keep the user's input if sending fails.
- **Compliance:** keep the legal microcopy under the button and its links to CGV and Privacy.

### Cookie consent (`CookieConsent.jsx`), CNIL-compliant
- **Banner:** fixed to the bottom of the screen. Cream background, 2px brass top border.
  - **"Accept all" and "Refuse all" are both primary buttons of identical size.** This is a legal requirement; do not demote Refuse.
  - "Manage preferences" is a full-width secondary button.
- **Preferences view:**
  - "Strictly necessary" is always active.
  - The Analytics toggle starts off; nothing is pre-checked.
  - Actions: Save my choices / Refuse all / Accept all.
- **Storage:** the choice is saved as `fa_consent = {analytics: boolean, ts}`. Production should also re-prompt after 6 months.
- **Analytics:** load the analytics script **only** when `analytics === true`.
- Add a "Cookie settings" link in the footer that reopens the banner.

### Other behaviour
- **Analytics:** privacy-respecting only (Plausible, Fathom or Matomo; client to choose). **No Google Analytics.**
- **Scroll reveal:** each top-level block in `main` fades in from opacity 0 and translateY(18px) over 350ms with `cubic-bezier(0.25,0.1,0.25,1)` once its top passes 90% of the viewport height. Blocks already in view show immediately. Respect `prefers-reduced-motion`, with no animation. Use an IntersectionObserver in production.
- **Hover:** links go from green to brass over 150ms. Buttons darken one step. Cards lift.
- **Motion in general:** opacity and colour fades of 150–350ms only. No bounce.

## State management
All state is local; there is no global store.
- Header: menu open/closed.
- Cookie consent: `banner | prefs | closed`, plus `analytics` from localStorage.
- Enquiry form: field values, touched fields, submitted, sending, sent, and error.
- Journey: active tier tab.

Availability weeks and the article content should live in content files (Markdown/JSON, or Astro content collections) so they can be edited without code changes.

## Design tokens (`prototype/tokens/*.css`, copy as-is)

### Colours
| Token | Value |
|---|---|
| cream (page) | #F4F0E8 |
| parchment (alt section) | #F3EFE5 |
| white (card) | #FFFFFF |
| charcoal (headings, inverse surface) | #2F3133 |
| ink-soft (body text) | #55575B |
| muted | #8B8677 |
| fairway-green (primary) | #5F735B |
| fairway-deep (hover) | #495846 |
| antique-brass (accent, rules) | #A07B47 |
| brass-light | #BE9760 |
| green-beige | #C8C1A8 |
| soft-stone | #D9D2C5 |
| stone-line (hairline) | #E4DECF |
| text on dark | #F5F1E8 |

### Typography
- Display font: Cormorant Garamond, weight 500, line-height 1.1. Italic for taglines.
- UI/body font: Montserrat, weights 300/400/500/600, body line-height 1.65.
- Display sizes:
  - xl `clamp(38px, 6.2vw, 64px)`
  - lg `clamp(30px, 4.6vw, 44px)`
  - md `clamp(25px, 3.4vw, 32px)`
  - sm `clamp(21px, 2.4vw, 24px)`
- Body sizes: 17 / 15 / 13px. Caption: 11px.
- Tracking: caps 0.22em, wide 0.08em, display 0.01em.
- Fonts currently load from Google Fonts. **In production, self-host them** (for example with `@fontsource`). This avoids a GDPR issue with Google Fonts' CDN that German courts have ruled on and the CNIL has flagged.

### Spacing, radius, shadows and motion
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128px.
- Radius: 0, 2, 4px. The 999px pill is for badges only.
- Shadows:
  - card: `0 1px 2px rgba(47,49,51,.05), 0 6px 24px rgba(47,49,51,.07)`
  - lift: `0 2px 4px rgba(47,49,51,.06), 0 14px 40px rgba(47,49,51,.12)`
- Motion: ease `cubic-bezier(0.25,0.1,0.25,1)`; durations 150ms and 350ms.

## Brand rules (non-negotiable)
- No emoji, no exclamation marks, no hype words. Address readers as guests, never as users or customers.
- No gradients or patterns. Use at most two background tones per view.
- Corners stay near-sharp (0–4px). No pill buttons.
- Icons, if needed: Lucide at 1.5px stroke, in charcoal or brass.
- Accessibility: target WCAG 2.2 AA. Use semantic landmarks, visible focus rings and alt text on every image. Keep the dialog and mobile menu keyboard-operable.

## Assets (`prototype/assets/`)
- **Brand marks:** `logo-lockup.png`, `wordmark.png`, `crest.png` (favicon), `img-embossed-crest.png`.
- **Imagery:** `hero-villa.png`, `img-club-heritage.png`, `img-destination.png`, `img-golf-bag.png`, `img-dining.png`, `img-arch-lineart.png`, `og-cover.png`.
- **Original source:** `docs/brand-sheet-original.png`.
- **All imagery is low-resolution, cropped from a single brand sheet.** These are placeholders. Replace them with licensed hotel, course and dining photography before launch, and serve them as responsive AVIF/WebP. Request SVG versions of the logo and crest from the client.

## Launch blockers (outside design scope)
1. **Legal pages:** replace every `[bracketed]` field (RCS/SIREN, VAT, share capital, insurer, financial guarantor, Atout France number, host, deposit %, dates, DPO contact). French counsel must sign off.
2. **Photography:** replace the placeholder imagery.
3. **Backend:** enquiry endpoint, transactional email and CRM.
4. **Analytics:** choose a provider and gate it behind consent.
5. **Testing:** real-device testing on iOS Safari and Android Chrome. Lighthouse targets: ≥95 for performance, accessibility and SEO.
6. **SEO:** `robots.txt` and `sitemap.xml` are in `prototype/ui_kits/website/`. Move them to the site root and add the article URLs.

## Files
- `prototype/ui_kits/website/`: all screens, `app.jsx` (routes and META), and `index.html` (meta, OG and JSON-LD).
- `prototype/components/`: design-system components (`.jsx`, `.d.ts`, `.prompt.md`).
- `prototype/tokens/`, `prototype/styles.css`: CSS custom properties and font imports.
- `prototype/guidelines/`: visual specimen cards for colour, type, spacing and motion.
- `prototype/ds-loader.js`: prototype-only loader. Do not port.
- `docs/brand-and-design-system.md`: brand voice, visual foundations and legal notes.
- `docs/Website_technicals.docx`, `docs/Business_Operations.docx`: the client's original spec documents.
