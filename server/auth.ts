import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins/admin';
import { db } from './db.js';

/**
 * Better Auth instance — email/password sign-in with the admin role plugin.
 * Session tables are created by `npm run setup` (better-auth migrate) in server/.
 */
export const auth = betterAuth({
  appName: 'TPC Logistics',
  database: db,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Only the seeded admin should ever exist — no public registration.
    disableSignUp: true
  },
  plugins: [admin()],
  // Sessions expire after 24h (default is 7 days) and are refreshed at most
  // every 8h — a stolen cookie is useful for a much shorter window.
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 8
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60
    // Note: Better Auth additionally applies its own stricter rules to
    // high-risk paths — sign-in/sign-up/change-password are capped at 3
    // requests per 10 seconds per IP on top of the values above.
  },
  trustedOrigins: [
    // Dev: the Vite dev server (proxy target for /api/*).
    // Prod: BETTER_AUTH_URL (e.g. https://your-project.vercel.app).
    process.env.BETTER_AUTH_URL || 'http://localhost:5173',
    // Local dev: Express server on API_PORT.
    ...(process.env.API_PORT ? [`http://localhost:${process.env.API_PORT}`] : [])
  ],
  advanced: {
    useSecureCookies: process.env.COOKIE_SECURE === 'true',
    ipAddress: {
      // Vercel (and Render) terminates TLS and sets X-Forwarded-For to the real
      // client IP. Resolving it keeps the rate limiters per-IP — without it
      // Better Auth falls back to a single shared bucket any attacker could exhaust.
      ipAddressHeaders: ['x-forwarded-for']
    }
  }
});
