import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth client — talks to /api/auth/* on the same origin
 * (Vite proxies /api to the Express backend in dev; Express serves
 * both in production).
 */
export const authClient = createAuthClient();
