import 'dotenv/config';
import { app, seedAdmin } from './app.js';
import { db } from './db.js';
import { logger } from './utils/logger.js';

const PORT = Number(process.env.API_PORT) || 5000;

/* ------------------------------- boot ---------------------------------- */

seedAdmin()
  .then(() => {
    const server = app.listen(PORT, () => {
      logger.info({ port: PORT }, 'TPC Logistics API listening');
    });

    /* ------------------------ graceful shutdown ------------------------ */
    const shutdown = (signal: string) => {
      logger.info({ signal }, 'shutting down gracefully');
      server.close(() => {
        db.close();
        logger.info('shutdown complete');
        process.exit(0);
      });
      // Force-exit if connections refuse to drain (e.g. a hung keep-alive)
      setTimeout(() => {
        logger.warn('forced shutdown after timeout');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  })
  .catch((err: unknown) => {
    logger.error({ err: String(err) }, 'failed to boot — exiting');
    process.exit(1);
  });
