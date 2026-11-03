-- Media library (files in the R2 bucket fairway-atelier-media, binding MEDIA) and journal
-- articles, edited in /admin/media and /admin/journal. Seeded from the former
-- src/content/journal/*.md and the brand-sheet images in src/assets/ (to be replaced, T-10).
CREATE TABLE media (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  alt TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE articles (
  slug TEXT PRIMARY KEY,                           -- URL: /journal/<slug>
  sort_order INTEGER NOT NULL DEFAULT 0,
  eyebrow TEXT NOT NULL,                           -- line above the title, e.g. "Our USP · The Golf"
  kicker TEXT NOT NULL,                            -- category, e.g. "The Golf"; also the "Continue reading" label
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',                -- text on the /journal card
  hero_media_id TEXT REFERENCES media (id),
  lede TEXT NOT NULL DEFAULT '',                   -- italic opening paragraph
  body TEXT NOT NULL DEFAULT '',                   -- Markdown
  next_slug TEXT,                                  -- "Continue reading" target
  featured INTEGER NOT NULL DEFAULT 0,             -- large card at the top of /journal
  published INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO media (id, r2_key, filename, content_type, size, width, height, alt, uploaded_by) VALUES
  ('img-destination', 'img-destination.png', 'img-destination.png', 'image/png', 76365, 178, 186, 'A golf course above the water, with mountains behind', 'seed'),
  ('img-club-heritage', 'img-club-heritage.png', 'img-club-heritage.png', 'image/png', 83308, 170, 186, 'A lantern beside a Private Club sign on a stone wall', 'seed'),
  ('img-dining', 'img-dining.png', 'img-dining.png', 'image/png', 74083, 167, 186, 'A table set for dinner on a terrace at sunset', 'seed'),
  ('img-golf-bag', 'img-golf-bag.png', 'img-golf-bag.png', 'image/png', 68446, 163, 186, 'A leather golf bag with a Fairway Atelier tag', 'seed'),
  ('img-arch-lineart', 'img-arch-lineart.png', 'img-arch-lineart.png', 'image/png', 38627, 138, 186, 'Line drawing of a stone arch with a fleur-de-lis', 'seed');

INSERT INTO articles (slug, sort_order, eyebrow, kicker, title, excerpt, hero_media_id, lede, body, next_slug, featured, published) VALUES
  ('coast', 1, 'Our USP · The Golf', 'The Golf', 'Old, beautiful French links — and a pro who is yours all week', 'Incredible sea-side courses, some of the oldest in France, played above the cliffs of the Emerald Coast. And at your side the whole week, a dedicated English-speaking professional committed to one thing: your game.', 'img-destination', 'Incredible sea-side courses, some of the oldest in France, played above the cliffs of the Emerald Coast. And at your side the whole week, a dedicated English-speaking professional committed to one thing: your game.', '## Courses with a century behind them

From Golf de Dinard — laid out in 1887, the second-oldest in France — to the cliff-top fairways of Pléneuf-Val-André, these are old, beautiful, distinctly French links, with the Atlantic in every sightline.

> A dedicated pro at your side all week, committed to your game.

## A pro who follows you around

You are not handed a tee time and left to it. A full-time, English-speaking PGA professional accompanies your group all week — reading the wind, walking every hole, and genuinely invested in your play improving by the final round.

## Golf the way it should feel

Present when you want coaching, invisible when you want the round to breathe. The result is a week that is as much about playing better as it is about playing somewhere beautiful.', 'dining', 0, 1),
  ('dining', 2, 'Our USP · The Table', 'The Table', 'Amazing food every day, set against breathtaking scenery', 'Fine dining is not a once-in-the-week event; it is every day. Beautiful food and beautiful wines, taken in settings — sea-side cliffs, harbours, garden terraces — as memorable as the plates themselves.', 'img-dining', 'Fine dining is not a once-in-the-week event; it is every day. Beautiful food and beautiful wines, taken in settings — sea-side cliffs, harbours, garden terraces — as memorable as the plates themselves.', '## Something remarkable, daily

From a three-star centrepiece to an unhurried harbour lunch of Cancale oysters, every day carries a meal worth travelling for. The wines are chosen to match — beautiful bottles, poured without ceremony.

> Beautiful food and wine every day, above the sea-side cliffs.

## Scenery that earns its place

Dinner above the cliffs, lunch looking out to Saint-Malo, an evening table with the Atlantic turning gold. The setting is part of the cooking here, and it never disappoints.

## Tables already held

The hardest reservations — Le Coquillage, Le Jules Verne — are confirmed before your week is ever offered. You simply arrive; the table is waiting.', 'restore', 0, 1),
  ('restore', 3, 'Our USP · The Ease', 'The Ease', 'Small groups, true luxury, and never a bill in sight', 'A single group of four, an entirely touchless week, and everything — every table, transfer, and tee time — taken care of. From the moment you arrive, you never see a bill, backed by a concierge on call around the clock.', 'img-club-heritage', 'A single group of four, an entirely touchless week, and everything — every table, transfer, and tee time — taken care of. From the moment you arrive, you never see a bill, backed by a concierge on call around the clock.', '## Small groups, real luxury

Each journey takes one group of four — never a crowd, never a coach party. Two hotel tiers, sea-view rooms, and a standard of care that comes from keeping the numbers deliberately small.

> From the moment you arrive, you never see a bill.

## Touchless, and never a bill

Once you arrive, nothing asks to be paid, signed, or settled. Tables, transfers, tee times, and companion plans are arranged and paid ahead and quietly maintained — touchless and walletless, start to finish.

## A concierge, around the clock

One named host knows your week by heart, reachable 24/7 by phone, message, or WhatsApp. A change of plan, a special request, a late idea — handled, without you lifting a finger.', 'coast', 0, 1),
  ('why-we-chose-brittany', 10, 'Featured · The Coast', 'The Coast', 'Why we chose Brittany', 'On the Emerald Coast, the golf, the table, and the sea are never more than a few minutes apart — and that proximity is the whole idea.', 'img-destination', 'On the Emerald Coast, the golf, the table, and the sea are never more than a few minutes apart — and that proximity is the whole idea.', '', NULL, 1, 0),
  ('a-round-at-dinard', 11, 'The Courses', 'The Courses', 'A round at Dinard, France''s second-oldest course', '', 'img-club-heritage', '', '', NULL, 0, 0),
  ('an-afternoon-at-le-coquillage', 12, 'The Table', 'The Table', 'An afternoon with the Roellingers at Le Coquillage', '', 'img-dining', '', '', NULL, 0, 0),
  ('what-no-wallet-really-takes', 13, 'The Craft', 'The Craft', 'What “no wallet” really takes to arrange', '', 'img-golf-bag', '', '', NULL, 0, 0),
  ('crossing-to-mont-saint-michel', 14, 'The Coast', 'The Coast', 'Crossing to Mont-Saint-Michel, quietly', '', 'img-arch-lineart', '', '', NULL, 0, 0);
