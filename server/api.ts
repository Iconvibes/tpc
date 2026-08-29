import type { IncomingMessage, ServerResponse } from 'node:http';
import { app, seedAdmin } from './app.js';

/**
 * Vercel serverless entry point — wraps the Express app.
 * The database is initialized at module load time (better-sqlite3 is sync),
 * so we only need to seed the admin on cold start.
 */
const initPromise = seedAdmin();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await initPromise;
  return new Promise<void>((resolve) => {
    app(req as any, res as any, () => resolve());
  });
}
