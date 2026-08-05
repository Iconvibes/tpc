import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for public write endpoints (contact form, quote requests).
 * Prevents spam/abuse while being generous enough for real customers.
 * Tunable via env: RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX.
 */
export const publicLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  limit: Number(process.env.RATE_LIMIT_MAX) || 60, // 60 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this address — please try again in a few minutes.' }
});
