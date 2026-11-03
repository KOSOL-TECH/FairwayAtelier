-- Availability weeks, edited in /admin/weeks. Date labels ("Sun 10 – Sun 17 May 2026",
-- "10–17 May 2026") and status labels are derived in src/lib/weeks.ts, not stored.
CREATE TABLE weeks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_date TEXT NOT NULL UNIQUE,                 -- YYYY-MM-DD; the week leaves the site once this date has passed
  end_date TEXT NOT NULL,                          -- YYYY-MM-DD
  status TEXT NOT NULL CHECK (status IN ('booking', 'limited', 'sold', 'waitlist')),
  summary TEXT NOT NULL,                           -- tier summary on the Home preview
  standard TEXT NOT NULL,                          -- Standard tier availability text
  signature TEXT NOT NULL,                         -- Signature tier availability text
  dining TEXT NOT NULL,                            -- headline tables
  featured INTEGER NOT NULL DEFAULT 0,             -- show in the Home preview
  published INTEGER NOT NULL DEFAULT 1,            -- 0 = draft, hidden from the site
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Seed: the weeks from the former src/content/availability.json.
INSERT INTO weeks (start_date, end_date, status, summary, standard, signature, dining, featured) VALUES
  ('2026-05-10', '2026-05-17', 'booking',  'Standard & Signature', 'Available', 'Available', 'Le Coquillage, Le Jules Verne confirmed', 1),
  ('2026-06-07', '2026-06-14', 'limited',  'Signature only', 'Waitlist', 'Two suites remaining', 'Le Coquillage confirmed', 1),
  ('2026-09-13', '2026-09-20', 'booking',  'Standard & Signature', 'Available', 'Available', 'Le Coquillage, Le Jules Verne confirmed', 1),
  ('2026-10-04', '2026-10-11', 'sold',     'Waitlist', 'Sold', 'Sold', '—', 1),
  ('2026-10-18', '2026-10-25', 'waitlist', 'Waitlist', 'Waitlist', 'Waitlist', 'To be confirmed', 0);
