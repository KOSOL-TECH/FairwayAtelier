# Fairway Atelier

Marketing site for Fairway Atelier (bespoke luxury golf travel, Brittany). Astro + TypeScript with React islands, deployed to Cloudflare Workers. `prototype/` and `docs/` are the design reference and are not shipped.

## Backlog (mandatory)

`BACKLOG.md` is the single source of truth for all Fairway Atelier work.

- **Before starting any task:** read `BACKLOG.md`. Move the matching item to **In progress**, or add it if missing.
- **When finishing any task:** update `BACKLOG.md` before reporting back. Move the item to **Done** with the date and a short note, and add any follow-up work or new client decisions you discovered.
- Commit backlog changes together with the work they describe.
- Follow the "How to update" rules at the bottom of `BACKLOG.md`.

## Key references

- `README.md`: design handoff spec (copy, behaviour, tokens, launch blockers)
- `docs/development.md`: commands, structure, content editing, Cloudflare hosting
- Copy in `prototype/ui_kits/website/*.jsx` is approved and must be used verbatim.
- This project has `wrangler.jsonc`, so use Wrangler (not the `cf` CLI) for deploys and Worker resources.
