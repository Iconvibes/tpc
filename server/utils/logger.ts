import pino from 'pino';
import type { Request, Response, NextFunction } from 'express';

/**
 * Structured logger (pino). Level is configurable via LOG_LEVEL;
 * pretty-printing is enabled automatically in non-production dev.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  ...(process.env.NODE_ENV !== 'production'
    ? { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } } }
    : {}),
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
});

/**
 * Request logging middleware — logs method, path, status, duration and a
 * short client identifier on every completed request.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - started;
    if (req.path.startsWith('/api')) {
      logger.info(
        { method: req.method, path: req.path, status: res.statusCode, durationMs: duration },
        'request'
      );
    }
  });
  next();
}
