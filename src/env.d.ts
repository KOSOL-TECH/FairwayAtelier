declare namespace App {
  interface Locals {
    /** Signed-in admin user, set by src/middleware.ts on /admin and /api/admin requests */
    adminEmail?: string;
  }
}
