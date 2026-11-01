# Fairway Atelier — Design System

**Fairway Atelier** is a bespoke luxury golf travel brand ("Bespoke Luxury Golf Travel") centred on **golf holidays in Brittany, France**. Tagline: *Play Beautifully. Travel Effortlessly.* French old-world elegance, warm hospitality, private-club refinement, understated luxury — editorial and atmospheric, never commercial. Positioned for couples and small groups (couple-friendly, never overly masculine).

**Booking model — enquiry-first.** The site does not take deposits at launch. The primary conversion is a qualified enquiry leading to a 30–45 min consultation call; pricing is always range-based. Copy presents the **dual-tier hotel architecture** (Standard vs. Signature) with restraint — the buyer chooses on the call, not on the page.

**Dual tiers:** *Standard* — anchored at EMERIA Dinard Hôtel Thalasso & Spa, from $13,500/guest ($13,500–15,500). *Signature* — anchored at Hôtel Barrière Le Grand Hôtel Dinard (Belle-Époque), from $19,000/guest ($19,000–22,000).

**French legal (must appear in product):** Atout France registration number in the footer of every page beside the French entity name; named-asset availability disclosure wherever restaurants/hotels/courses are named ("Named restaurants, hotels, and courses are illustrative. Final inclusions per trip are subject to availability and confirmed during the consultation call."); GDPR privacy, CNIL cookie consent (Refuse-all as prominent as Accept-all, nothing pre-checked). Privacy-respecting analytics only (Plausible/Fathom/Matomo) — no Google Analytics.

**Source:** a single brand sheet PNG provided by the user (`uploads/Fairway Atelier_Logo.png`, archived at `assets/brand-sheet.png`). All colors, type choices, logo crops, and imagery derive from it. No codebase or Figma was provided.

## Tone of voice
- **Refined** — sophisticated, polished, discreet
- **Warm** — welcoming, attentive, gracious
- **Trusted** — reliable, experienced, exacting
- **Inspired** — curated, enriching, memorable
- **Effortless** — seamless, intuitive, elevated

## CONTENT FUNDAMENTALS
- Voice is first-person-plural brand ("we curate"), addressing the reader as a valued guest, never "users" or "customers" — "discerning golfers and their companions."
- Short, poised sentences. Two-beat taglines with periods: "Play Beautifully. Travel Effortlessly."
- Vocabulary: bespoke, curated, atelier, journey, heritage, seamless, refined. Avoid hype words (amazing, awesome), exclamation marks, and emoji — **no emoji, ever**.
- Labels and eyebrows are UPPERCASE Montserrat with wide letter-spacing ("BRAND ESSENCE", "COLOR PALETTE").
- Headlines are serif with normal title case; italic serif for taglines and grace notes.
- Concrete, sensory promises over feature lists: "world-class play with timeless hospitality."

## VISUAL FOUNDATIONS
- **Color:** warm cream page (#F4F0E8), charcoal ink (#2F3133), pastel fairway green (#5F735B) as the primary action color, antique brass (#A07B47) for line accents/premium detailing (used sparingly), green beige (#C8C1A8) and soft stone (#D9D2C5) as quiet neutrals. Max two background tones per view (cream + parchment or cream + charcoal footer). Contrast: Charcoal-on-Green-Beige and Charcoal-on-Cream both pass AA; reversed combos need larger type/weight (WCAG 2.2 AA target).
- **Type:** Cormorant Garamond (headlines, large; medium weight; italic for taglines) + Montserrat (supporting text, labels, buttons). Uppercase Montserrat labels at 0.22em tracking are a core motif.
- **Ornament:** thin brass rules, em-dash flanked labels (—— LABEL ——), fleur-de-lis and crest devices from cropped assets only. Double hairline border frames around pages/cards.
- **Layout:** generous symmetric whitespace, centered lockups for brand moments, single vertical hairline dividers between columns.
- **Corners:** near-sharp (0–4px). No pill buttons.
- **Shadows:** very soft, low-opacity charcoal; most separation via hairlines instead of shadow.
- **Backgrounds:** flat tones + faint etched-landscape imagery; no gradients, no patterns.
- **Imagery:** warm, golden-hour, old-world (stone walls, cypress, lake courses, leather, linen). Never cool/blue-graded.
- **Animation:** restrained — opacity/color fades 150–350ms, standard easing. No bounces.
- **Hover:** links green → brass; buttons darken one step; cards lift with --shadow-lift.
- **Buttons:** rectangular, uppercase Montserrat 12–13px with wide tracking; primary = **Pastel Fairway Green fill with high-contrast Charcoal text** (spec §10), secondary = charcoal hairline outline, ghost/tertiary = brass-underlined text link. Primary CTA copy: "View available departures"; secondary: "Enquire about a private journey". Enquiry form ≤ 8 fields.

## ICONOGRAPHY
- No icon system in the source. Brand devices only: crest, fleur-de-lis, thin rules (all cropped in `assets/`).
- For functional UI icons use **Lucide** from CDN at 1.5px stroke, colored charcoal or brass — this is a substitution; flag to the brand owner. No emoji, no unicode dingbats except the em-dash rule motif.

## Index
- `styles.css` — global entry (imports tokens + fonts)
- `tokens/` — colors, typography, spacing, base resets
- `assets/` — logo-lockup, crest, wordmark, brand-sheet, 6 imagery crops (club-heritage, destination, golf-bag, dining, arch-lineart, embossed-crest)
- `guidelines/` — foundation specimen cards
- `components/core/` — Button, Input, Select, Checkbox, Radio, Switch, Card, Badge, Tabs, Dialog, Eyebrow, Divider
- `ui_kits/website/` — marketing site screens
- `SKILL.md` — agent skill entry

## Intentional additions
- **Eyebrow** and **Divider** components — codify the brand's uppercase-label and brass-rule motifs (seen throughout the sheet).
- Fonts load from Google Fonts CDN (Cormorant Garamond, Montserrat) — matches the sheet's named faces exactly.
