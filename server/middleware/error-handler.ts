import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Wraps an async route handler so thrown/rejected errors reach Express's
 * error-handling pipeline instead of crashing the process or hanging.
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/** Flattens a Zod error into a readable { field: message } map. */
function zodDetails(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'body';
    if (!out[field]) out[field] = issue.message;
  }
  return out;
}

/**
 * Global error handler — the single place every error becomes an HTTP
 * response. Expected (AppError/Zod) errors map to their status codes;
 * anything else is logged and kept opaque to the client.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Validation failures from our Zod schemas
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed.', fields: zodDetails(err) });
  }

  if (err instanceof AppError) {
    const body: Record<string, unknown> = { error: err.message };
    if (err.details !== undefined) {
      body[err instanceof ValidationError ? 'fields' : 'details'] = err.details;
    }
    return res.status(err.statusCode).json(body);
  }

  // Malformed JSON body
  const bodyError = err as { type?: string; message?: string };
  if (bodyError.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }

  // Unexpected errors — log the details, hide them from the client
  logger.error({ err: String((err as Error)?.stack || err), method: req.method, path: req.path }, 'unhandled error');
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : (err as Error)?.message || 'Internal server error.'
  });
}

/** Express 404 for unknown API routes (falls through to the SPA for non-API). */
export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}.` });
}
