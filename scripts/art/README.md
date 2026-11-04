# Brand art generators

Vector redraws of the brand-sheet artwork, so it stays sharp at any size. Each generated image carries a small Fairway Atelier mark.

- `crest.mjs` → `src/assets/crest.svg` (also `public/favicon.svg`; `public/favicon.png` and `public/assets/crest.png` are rendered from it). The FA monogram uses Cormorant Garamond outlines.

Run from a folder with `opentype.js` installed: `node crest.mjs <repo> <out.svg>`.

These are interim redraws for the client to approve; the client's own SVG logo files (BACKLOG T-11) replace the crest when they arrive.

The Home hero villa sketch is not generated here: it is the handed-over drawing in `src/assets/villa-banner.svg` (a `<symbol id="fav-villa">` inlined once on the page, styled by the `.fav-*` rules in `src/styles/components.css`). Do not edit its contents.
