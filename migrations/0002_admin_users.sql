-- People who can sign in to /admin. Passwords are set with
-- `node scripts/set-admin-password.mjs <email>`, never stored in plain text.
CREATE TABLE admin_users (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
