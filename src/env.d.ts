declare namespace App {
  interface Locals {
    /**
     * The signed-in admin's email (`dev@localhost` in `astro dev`), set by
     * src/middleware.ts on /admin and /api/admin requests. Recorded in the audit log.
     */
    adminEmail?: string;
    /**
     * The signed-in account, set on account, sign-in and admin requests. Never
     * set on the public pages, which are cached and identical for everyone.
     */
    account?: import('./lib/account/store').SessionAccount;
    /** Whether that sign-in is recent enough to open the admin */
    signInFresh?: boolean;
  }
}

declare namespace Cloudflare {
  /**
   * Secrets for Google and Apple sign-in (docs/accounts.md). All optional: a
   * provider's button appears only once its secrets are set with
   * `npx wrangler secret put <NAME>`.
   */
  interface Env {
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    APPLE_CLIENT_ID?: string;
    APPLE_TEAM_ID?: string;
    APPLE_KEY_ID?: string;
    APPLE_PRIVATE_KEY?: string;
  }
}
