import type { Request, Response, NextFunction } from 'express';

/**
 * Hardening headers applied to every response.
 *
 * - nosniff / frame-ancestors: no MIME sniffing, page can't be embedded in a frame.
 * - referrer-policy: don't leak the full URL to third parties.
 * - permissions-policy: camera / microphone / geolocation APIs are never granted.
 * - COOP same-origin: isolates the page from cross-origin window references.
 * - HSTS: only when the request arrived over HTTPS (Render terminates TLS and
 *   forwards X-Forwarded-Proto, which Express maps onto req.secure).
 * - CSP: strict allow-list. The Vite build emits only hashed same-origin assets,
 *   plus the Google Fonts stylesheet and the Google Maps embed iframe.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "frame-src https://www.google.com",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests'
    ].join('; ')
  );
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
}
