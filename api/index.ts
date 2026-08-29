/**
 * Vercel serverless function entry point.
 * Vercel requires all serverless functions to live in the `api/` directory.
 * This wraps the Express app from server/ and handles cold-start initialization.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { app, seedAdmin } from '../server/app.js';

const initPromise = seedAdmin();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await initPromise;
  return new Promise<void>((resolve) => {
    app(req as any, res as any, () => resolve());
  });
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};
