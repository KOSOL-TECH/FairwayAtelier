-- Every change made in the admin: who, when, what.
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  email TEXT NOT NULL,
  action TEXT NOT NULL,      -- e.g. create, update, delete
  entity TEXT NOT NULL,      -- e.g. week, article, page_block
  entity_id TEXT NOT NULL,
  detail TEXT                -- optional JSON with the changed fields
);

CREATE INDEX audit_log_at ON audit_log (at DESC);
