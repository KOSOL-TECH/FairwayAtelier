# Fairway Atelier accounts: design

Guest profiles for the public site, the customer sheets in the admin CRM, and the admin role. Requested by the client on 2026-11-10 and tracked as T-33 in `BACKLOG.md`.

## What the client asked for

- A profile page for every guest, with everything that helps the team plan their week.
- Account creation that leads with a few questions about golf and the offer, then asks for the account last. At most 5 frames, under a minute, and every question can be skipped.
- Optional questions such as "How did you hear about us?".
- Google and Apple quick sign-in. No two-factor step anywhere.
- More questions asked later, across the site, feeding customer sheets in the admin.
- An admin role on a profile that opens the admin panel.

## Decisions

| Topic | Choice |
|---|---|
| Sign-in methods | Google, Apple, and email with a password. No emailed codes and no second factor. Passwords were the client's choice for the admin too, after emailed codes failed to arrive (X-21). |
| One system | Guests and the team share one `accounts` table and one sign-in page (`/sign-in`). `role = 'admin'` opens `/admin`. The separate admin login is retired; `/admin/login` passes old bookmarks on. |
| Admins | Sign in with email and password only. An admin account is never opened through Google or Apple, and has no "forgot password": the password is set with `scripts/set-admin-password.mjs`. Without a second factor, this keeps a taken-over mailbox or Google account from opening the admin. `/admin` also needs a sign-in from the last 12 hours. |
| Questions | Declared once in code (`src/lib/account/questions.ts`). Answers are rows keyed by question id, so a new question needs no database change and shows in the profile and the CRM sheet at once. |
| Email confirmation | A link in the welcome email. It never blocks anything. Until the address is confirmed, a profile does not show past enquiries sent from it, and the account cannot be made an admin. Google and Apple accounts are confirmed already. |
| Retention | Guest accounts are deleted 3 years after the last sign-in or change, unless the same email has a booked enquiry. Same period as enquiries (D-13). Counsel to confirm. |

## Onboarding (`/join`)

Five frames. Frames 1 to 4 are one tap each and move on by themselves; each has **Skip**. Nothing is stored until the account is created.

1. **Your golf:** "How would you describe your golf?"
2. **Your week:** "What matters most in a week away?"
3. **Your party:** "Who would you travel with?"
4. **One last thing:** "How did you hear about us?"
5. **Your profile:** Continue with Google, Continue with Apple, or name + email + password. "Not now" leaves without an account.

The answers travel with the account request: in the sign-up body for email, or inside the signed sign-in cookie for Google and Apple. "Not now" keeps them in the tab (`sessionStorage`) only. The flow's rules are a small state machine in `src/lib/account/join.ts`.

**Profile creation comes first** (client request 2026-11-11). The header link reads "Create profile" and leads to `/join` for a browser that has never held a profile, "Sign in" for one that has, and "Profile" when signed in. What tells them apart is a cookie, `fa_known`, that holds only "1", is set at sign-in and is kept after signing out (removed when the profile is deleted). `/join` shows "Already have a profile? Sign in here instead." under every frame.

**On Private Journeys (`/private`)** the same flow is set into the page in place of the button to the enquiry form. Creating the profile there files a private-journey request in the enquiries inbox ("Private journey: dates to be agreed", with the guest's answers) and emails the team; a guest who is already signed in sees one button that does the same (`src/lib/account/private.ts`). The guest gets no enquiry confirmation email for these: their profile says the request is with the team.

Google and Apple sign-in are parked (client decision 2026-11-11); the code stays, and the buttons stay hidden until the secrets below are set.

## Profile (`/account`)

Sections: About you, Your golf, Your journey, At the table, Your stay, Staying in touch, Your enquiries, Signing in. Choices save on tap, text saves when the field loses focus. Questions that do not apply are left out (no handicap for a non-golfer). Taking a copy of the data (JSON) and deleting the profile are on a separate page, `/account/data`, linked as "Your data" in the footer and from the privacy policy (client request 2026-11-11).

## Later questions

For signed-in guests, public pages may show one small card with the next unanswered question (not on Enquire, the legal pages or the profile itself). One per day at most in a browser; closing the card leaves it for a week. Skipping a question means it is not asked again; it stays editable in the profile. The team can also fill answers in from the customer sheet after a call.

## Admin CRM

- `/admin/customers`: every account, with search, role filter, number of details given, enquiry count and last sign-in. **Start a sheet** creates a sheet for someone who has no profile yet.
- `/admin/customers/<id>`: the customer sheet. Identity, every answer with its source (onboarding, their profile, a later question, the team) and date, the questions still to ask, enquiries from the same email, team notes, role, delete.
- An enquiry's page links to the customer sheet, or starts one from the enquiry's name, email and phone.
- **Claiming a sheet the team started:** when that guest later creates a profile with the same email, nobody is signed in on the spot. They are emailed a link to set a password (or they use Google or Apple with that address). Only the owner of the mailbox opens the sheet, and what the team recorded is there for them.

## Architecture

- **Data (migration 0008):** `accounts` (email, optional password hash, role, session key, name, phone, country, email opt-in, team notes, last sign-in), `account_identities` (Google/Apple subject → account), `account_answers` (account, question id, value, source), `account_tokens` (hashed single-use links for email confirmation and password reset). Existing `admin_users` rows are copied into `accounts` as admins.
- **Sessions:** `__Host-fa_session`, HttpOnly, Secure, SameSite=Lax, 30 days, signed with HMAC (`SESSION_SECRET`). It holds the account id, the account's session key and the sign-in time. The middleware checks the key against D1 on every account or admin request, so a password change or reset, a role change, "sign out on my other devices" or a deleted account ends the sessions. A second, readable cookie `fa_in=1` only tells cached pages to show "Profile" instead of "Sign in" and to ask for a later question.
- **Admin gate:** `/admin` and `/api/admin` need a session whose account has `role = 'admin'` and a sign-in within the last 12 hours. Role changes are made on the customer sheet and audited. The admin role needs a confirmed email and a password; granting it removes any Google/Apple sign-in and ends the account's sessions. Nobody changes their own role, so there is always an admin.
- **Google and Apple:** authorization-code flow against the providers' standard endpoints (PKCE for Google). State, nonce and PKCE verifier sit in a signed, 10-minute `__Host-fa_oauth` cookie. ID tokens are verified with `jose` against the provider's published keys (signature, issuer, audience, expiry, nonce). Apple returns by a cross-site form POST, so that cookie is `SameSite=None` for Apple only.
- **Linking rules:** a Google/Apple identity already on file signs that account in. Otherwise the provider must have confirmed the email; a guest account with that email is linked. If that account's own email was never confirmed, its password is removed first (which also ends its sessions), so someone who registered the address earlier cannot keep access.
- **Emailed links:** opening a link changes nothing, because mail scanners open links too. The confirmation page and the reset page act on a button. Confirmation also needs the same account to be signed in, so a stranger who registered someone's address cannot get it confirmed by the real owner's click. A password reset confirms the email and ends earlier sessions.
- **Cross-site requests:** Astro's built-in origin check is off (`security.checkOrigin: false`); `src/middleware.ts` applies the same check to every non-GET request (not only forms), with one exception: Apple's callback, which is protected by the state value instead.
- **Caching:** public pages stay edge-cached and identical for everyone. Account, sign-in and auth routes never declare cache intent and carry `no-store`. As a backstop, the middleware withdraws the cache intent from any public response that sets a cookie or is a 5xx. Anything personal on a cached page is fetched by the browser after load.
- **Email:** welcome/confirmation, password reset and sheet-claim emails go out through the existing `EMAIL` binding, from atelier@. They contain only the link, never anything a visitor typed, so the site cannot be used to send someone chosen words.
- **Limits:** sign-in 5/min per IP and per email (`LOGIN_LIMITER`); sign-up, reset and confirmation emails 5/min per IP and per address (`SIGNUP_LIMITER`); and in D1 (`issueToken`), at most 3 emails of a kind per account per day and 200 per kind per day. The limits are built so they cannot be turned against a guest: earlier links keep working when another is sent, a reset is refused only while an earlier reset link is still usable, and a flood of sign-ups cannot use up the resets. Turnstile would add to this (D-06).
- **Customer sheets and unconfirmed profiles:** what the team records on a sheet is shown to whoever holds the profile. So the team can add details only once that can be nobody but the guest: the email is confirmed, or the team started the sheet and nobody can sign in to it yet. For a profile registered without confirming the address, the sheet says so and takes team notes only. A sheet saves only the fields the team changed since opening it, so it cannot undo something the guest changed in the meantime.

## Known limits

- **The per-email sign-in limit can be used to lock someone out.** Five wrong passwords a minute for an address make the sixth attempt wait, for the real owner too, for as long as it is kept up. This was already true of the admin login, and it is the price of stopping many machines from guessing at one account. Turnstile on sign-in (D-06) would remove the trade-off.
- **Links in logs.** Reset and confirmation links carry their token in the address, and Workers observability records request addresses. Anyone who can read the Worker's logs in the Cloudflare dashboard could use a reset link during its hour. Those people can already read and change the database, so this crosses no new boundary, but keep dashboard access narrow.
- **Google and Apple are untested against the real services** until their secrets are set (see below).

## Setting up Google and Apple (client)

The buttons appear only when the matching secrets exist. Until then the site offers email sign-in only.

**Google** (free): Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application). Authorised redirect URI: `https://fairwayatelier.com/auth/google/callback`. Then:

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

**Apple** (needs the Apple Developer Program, 99 USD a year): create an App ID with Sign in with Apple, a Services ID (this is the client id) with domain `fairwayatelier.com` and return URL `https://fairwayatelier.com/auth/apple/callback`, and a Sign in with Apple key (`.p8`). Then:

```bash
npx wrangler secret put APPLE_CLIENT_ID     # the Services ID
npx wrangler secret put APPLE_TEAM_ID
npx wrangler secret put APPLE_KEY_ID
npx wrangler secret put APPLE_PRIVATE_KEY   # the whole .p8 file contents
```

Guests who choose Apple's "Hide My Email" get a relay address. To email them, register `fairwayatelier.com` and atelier@ under Sign in with Apple for Email Communication in the Apple developer account.

Neither provider could be tested end to end before the secrets exist. The flow is covered by tests against a stand-in provider (`src/lib/account/oauth.test.ts`); sign in once with each after setting the secrets.

## Working on accounts

- **Code:** `src/lib/account/` (questions, profile fields, onboarding flow, signed cookies, sessions, request guard, store, sign-in, Google/Apple, emails), pages under `src/pages/` (`join`, `sign-in`, `sign-out`, `forgot-password`, `reset-password`, `account/`, `auth/`, `api/account/`, `admin/customers/`), islands `JoinFlow`, `ProfileEditor`, `ProfilePrompt`, layout `AuthLayout`, styles `src/styles/account.css`.
- **Adding a question:** add it to `QUESTIONS` in `src/lib/account/questions.ts` (give it a `prompt` number to have it asked later). Never rename an id once live: answers are keyed by it.
- **Making someone an admin:** open their customer sheet and set Role to Admin (they need a confirmed email and a password), or run `node scripts/set-admin-password.mjs <email>`, which creates the account if needed and sets its password.
- **Removing an admin:** set their Role to Guest on the sheet, then delete the sheet if they should have no account at all.
- **Locally:** `npx wrangler d1 migrations apply DB --local`, then `npm run dev` or `npm run preview`. The local mail binding writes each email to `.wrangler/tmp/email/`, so confirmation and reset links can be followed. In `astro dev` the admin opens without signing in, as before.
- **Deploying a schema change:** apply the migration to the live database before pushing (`docs/admin.md`). Migration 0008 only adds tables. `admin_users` is left in place because the previous Worker version still signs in against it; it is no longer read, and a later migration can drop it (T-34). Rolling the Worker back to a version from before accounts would bring back the old admin login with the passwords as they were on 2026-11-10.
