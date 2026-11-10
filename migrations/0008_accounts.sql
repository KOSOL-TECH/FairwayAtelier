-- Accounts for guests and the team (docs/accounts.md). One table for everyone:
-- role = 'admin' opens /admin. Guests sign in with Google, Apple or a password.
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,                             -- random id
  email TEXT NOT NULL UNIQUE,                      -- lower case
  email_verified INTEGER NOT NULL DEFAULT 0,       -- 1 once confirmed by the emailed link, a password reset, Google or Apple
  password_hash TEXT,                              -- PBKDF2 (src/lib/admin/password.ts); NULL for Google/Apple-only accounts and sheets the team started
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  session_key TEXT NOT NULL,                       -- carried by every session cookie; a new value signs the account out everywhere
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,     -- journal and newly opened weeks by email; off unless the guest turns it on
  marketing_opt_in_at TEXT,
  internal_notes TEXT NOT NULL DEFAULT '',         -- the team's notes, never shown to the guest
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_seen_at TEXT                                -- last sign-in; NULL for a sheet the team started that the guest has not claimed
);

CREATE INDEX accounts_created ON accounts (created_at DESC);

-- Google and Apple sign-ins: the provider's permanent id for a person, and the account it opens.
CREATE TABLE account_identities (
  provider TEXT NOT NULL CHECK (provider IN ('google', 'apple')),
  subject TEXT NOT NULL,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',                  -- the address the provider gave (an Apple relay address if the guest hid theirs)
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (provider, subject)
);

CREATE INDEX account_identities_account ON account_identities (account_id);

-- Profile answers, keyed by the question ids in src/lib/account/questions.ts,
-- so a new question needs no migration.
CREATE TABLE account_answers (
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  value TEXT NOT NULL,                             -- '' = skipped or cleared; several choices are a JSON list
  source TEXT NOT NULL CHECK (source IN ('onboarding', 'profile', 'prompt', 'team')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (account_id, question)
);

-- Single-use links sent by email. Only a hash is stored: the link itself exists
-- only in the email. Rows are kept for a few days after use, as the count of
-- recent rows is also the brake on how many emails go out.
CREATE TABLE account_tokens (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('confirm_email', 'reset_password')),
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX account_tokens_account ON account_tokens (account_id, purpose, created_at);
CREATE INDEX account_tokens_created ON account_tokens (created_at);

-- Today's admins become accounts with the admin role, keeping their passwords.
-- admin_users is left in place and no longer read: the Worker version that is
-- live while this migration runs still signs in against it.
INSERT OR IGNORE INTO accounts (id, email, email_verified, password_hash, role, session_key, created_at, updated_at)
SELECT lower(hex(randomblob(16))), lower(email), 1, password_hash, 'admin', lower(hex(randomblob(16))), created_at, updated_at
FROM admin_users;
