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
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100
  },
  trustedOrigins: [
    // Dev: the Vite dev server (proxy target for /api/*).
    process.env.BETTER_AUTH_URL || 'http://localhost:5173',
    // Prod: the Express server serves both the site and the API on API_PORT.
    ...(process.env.API_PORT ? [`http://localhost:${process.env.API_PORT}`] : [])
  ],
  advanced: {
    useSecureCookies: process.env.COOKIE_SECURE === 'true'
  }
});
