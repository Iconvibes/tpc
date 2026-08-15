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

/**
 * Brute-force guard for the admin login endpoint. Better Auth applies its own
 * per-IP throttle on sign-in (3 per 10 s by default); this adds a long
 * cumulative window so an attacker can't keep hammering the password all day.
 */
export const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts — please try again in 15 minutes.' }
});
