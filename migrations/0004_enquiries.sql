-- Enquiries from the website form, listed in /admin/enquiries. The base for the CRM (BACKLOG T-05).
CREATE TABLE enquiries (
  id TEXT PRIMARY KEY,                             -- the enquiry's UUID, also in the team notification email
  received_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  dates TEXT NOT NULL,
  party TEXT NOT NULL,                             -- "Who is travelling" (the form's group field)
  tier TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',                -- the guest's own notes
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'booked', 'closed')),
  internal_notes TEXT NOT NULL DEFAULT '',         -- the team's notes, never shown to the guest
  last_contact_at TEXT NOT NULL,                   -- retention clock: enquiries with no booking are deleted 3 years after this (D-13)
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX enquiries_received ON enquiries (received_at DESC);
CREATE INDEX enquiries_status ON enquiries (status);
