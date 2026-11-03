-- Edits to page copy and images, made in /admin/pages. Only changed blocks are stored:
-- every block's approved original lives in code (src/lib/pages/*.ts), so a page with
-- no rows here renders exactly as approved.
CREATE TABLE page_blocks (
  page TEXT NOT NULL,                              -- registry id, e.g. "home"
  block TEXT NOT NULL,                             -- block key, e.g. "heroTitle"
  kind TEXT NOT NULL CHECK (kind IN ('line', 'text', 'markdown', 'image')),
  value TEXT NOT NULL,                             -- text, Markdown, or a media id
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (page, block)
);

-- The one content image not yet in the library (Dining & Golf venue card).
INSERT INTO media (id, r2_key, filename, content_type, size, width, height, alt, uploaded_by) VALUES
  ('img-embossed-crest', 'img-embossed-crest.png', 'img-embossed-crest.png', 'image/png', 67778, 151, 186, 'The Fairway Atelier crest embossed on leather', 'seed');
