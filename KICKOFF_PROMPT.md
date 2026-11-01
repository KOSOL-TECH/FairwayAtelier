# Claude Code kickoff

Unzip this package into the root of a local clone of `KOSOL-TECH/FairwayAtelier`, run `claude` there, and paste the prompt below.

---

Read `README.md` in full, then `docs/brand-and-design-system.md`. The `prototype/` folder is a high-fidelity HTML/React design reference. Recreate it as a production site. Do not ship the prototype.

1. Scaffold an Astro + TypeScript project at the repo root, using React islands only where interactivity is needed. Keep `prototype/` and `docs/` in the repo as reference.
2. Port the tokens as global CSS, self-host Cormorant Garamond and Montserrat, and build the components from `prototype/components/` with the same props.
3. Build every route in the README's Routes table, using the copy verbatim from the screen files. Generate per-page meta, OG tags, canonical and JSON-LD, plus `sitemap.xml` and `robots.txt`.
4. Implement responsive layouts with real media queries at 960px and 620px, and the hamburger menu at 1000px.
5. Implement the CNIL cookie consent, scroll reveal and enquiry form validation exactly as specified. Stub the enquiry endpoint behind an interface so email and the CRM can be wired up later.
6. Commit in logical steps with clear messages, push to `main`, and summarise anything that needs a decision from me.
