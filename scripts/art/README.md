# Brand art generators

Vector redraws of the brand-sheet artwork, so it stays sharp at any size. Each generated image carries a small Fairway Atelier mark.

- `crest.mjs` → `src/assets/crest.svg` (also `public/favicon.svg`; `public/favicon.png` and `public/assets/crest.png` are rendered from it). The FA monogram uses Cormorant Garamond outlines.
- `villa.mjs` → `src/assets/villa-right.svg` and `villa-left.svg`, the pencil-style villa behind the Home hero, signed "FA | FAIRWAY ATELIER" in the outer corner.

Run from a folder with `opentype.js` installed: `node crest.mjs <repo> <out.svg>`, `node villa.mjs <repo> <outDir>`.

These are interim redraws for the client to approve; the client's own SVG logo files (BACKLOG T-11) replace the crest when they arrive.
