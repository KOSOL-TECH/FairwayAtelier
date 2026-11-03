-- High-resolution photography replacing the low-res brand-sheet crops (2,400 px, free
-- Unsplash licence: commercial use, no attribution required; photographer and Unsplash id
-- kept in the filename). Files are in R2 under the same names.
INSERT INTO media (id, r2_key, filename, content_type, size, width, height, alt, uploaded_by) VALUES
  ('photo-cliff-golf', 'photo-cliff-golf.jpg', 'photo-cliff-golf.jpg (Toby Harvey / Unsplash AbOJ00eMm0Y)', 'image/jpeg', 854120, 2400, 1600, 'A clifftop fairway above a sandy cove and the sea', 'seed'),
  ('photo-links-green', 'photo-links-green.jpg', 'photo-links-green.jpg (Cristina Glebova / Unsplash bOruvBBvWVM)', 'image/jpeg', 767883, 2400, 1669, 'A seaside green with its flag, rocky shore and cliffs beyond', 'seed'),
  ('photo-sea-terrace', 'photo-sea-terrace.jpg', 'photo-sea-terrace.jpg (Izzudin Habib / Unsplash HrV__kt9im8)', 'image/jpeg', 374664, 2400, 1600, 'A long table laid in white linen on a terrace above the sea at dusk', 'seed'),
  ('photo-oysters', 'photo-oysters.jpg', 'photo-oysters.jpg (Oskar Kadaksoo / Unsplash hItzuDWSlGM)', 'image/jpeg', 696545, 2400, 1601, 'Fresh oysters on crushed ice with lemon', 'seed'),
  ('photo-haute-cuisine', 'photo-haute-cuisine.jpg', 'photo-haute-cuisine.jpg (Urban Gyllström / Unsplash MaWMfm-HCqQ)', 'image/jpeg', 277355, 2400, 2400, 'A chef finishing a plated dish with sauce', 'seed'),
  ('photo-sea-spa', 'photo-sea-spa.jpg', 'photo-sea-spa.jpg (Alex Bertha / Unsplash Jyg7xHRmXiU)', 'image/jpeg', 190434, 2400, 1600, 'An infinity pool meeting a calm sea in soft light', 'seed'),
  ('photo-dinard-villas', 'photo-dinard-villas.jpg', 'photo-dinard-villas.jpg (Pascal Bernardon / Unsplash pb0jOr_dlvA)', 'image/jpeg', 869865, 2400, 1351, 'Belle Époque villas above the rocks at Dinard', 'seed'),
  ('photo-golf-bag', 'photo-golf-bag.jpg', 'photo-golf-bag.jpg (Volodymyr Leush / Unsplash j5IydHJwpSk)', 'image/jpeg', 411261, 2400, 1602, 'A hand in a tweed jacket drawing an iron from a golf bag', 'seed'),
  ('photo-mont-saint-michel', 'photo-mont-saint-michel.jpg', 'photo-mont-saint-michel.jpg (Aaron Staes / Unsplash 9ZhxKn5lCBM)', 'image/jpeg', 389660, 2400, 1500, 'Mont-Saint-Michel across the salt meadows', 'seed'),
  ('photo-saint-malo', 'photo-saint-malo.jpg', 'photo-saint-malo.jpg (Sébastien Gautrais / Unsplash 2h-21AXRozo)', 'image/jpeg', 307909, 2400, 1600, 'The walls of Saint-Malo reflected in still water at golden hour', 'seed');

-- Journal heroes. Only articles still on their seeded image change, so an editor's choice is kept.
UPDATE articles SET hero_media_id = 'photo-cliff-golf' WHERE slug = 'coast' AND hero_media_id IN ('img-destination', 'img-club-heritage', 'img-dining', 'img-golf-bag', 'img-arch-lineart');
UPDATE articles SET hero_media_id = 'photo-sea-terrace' WHERE slug = 'dining' AND hero_media_id IN ('img-destination', 'img-club-heritage', 'img-dining', 'img-golf-bag', 'img-arch-lineart');
UPDATE articles SET hero_media_id = 'photo-sea-spa' WHERE slug = 'restore' AND hero_media_id IN ('img-destination', 'img-club-heritage', 'img-dining', 'img-golf-bag', 'img-arch-lineart');
UPDATE articles SET hero_media_id = 'photo-saint-malo' WHERE slug = 'why-we-chose-brittany' AND hero_media_id IN ('img-destination', 'img-club-heritage', 'img-dining', 'img-golf-bag', 'img-arch-lineart');
UPDATE articles SET hero_media_id = 'photo-oysters' WHERE slug = 'an-afternoon-at-le-coquillage' AND hero_media_id IN ('img-destination', 'img-club-heritage', 'img-dining', 'img-golf-bag', 'img-arch-lineart');
UPDATE articles SET hero_media_id = 'photo-golf-bag' WHERE slug = 'what-no-wallet-really-takes' AND hero_media_id IN ('img-destination', 'img-club-heritage', 'img-dining', 'img-golf-bag', 'img-arch-lineart');
UPDATE articles SET hero_media_id = 'photo-mont-saint-michel' WHERE slug = 'crossing-to-mont-saint-michel' AND hero_media_id IN ('img-destination', 'img-club-heritage', 'img-dining', 'img-golf-bag', 'img-arch-lineart');
UPDATE articles SET hero_media_id = 'photo-links-green' WHERE slug = 'a-round-at-dinard' AND hero_media_id IN ('img-destination', 'img-club-heritage', 'img-dining', 'img-golf-bag', 'img-arch-lineart');
