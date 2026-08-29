import express from 'express';
import compression from 'compression';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';
import { db, findShipment, shipmentToJson, type ShipmentRow } from './db.js';
import { sendShipmentUpdateEmail } from './notify.js';
import { logger, requestLogger } from './utils/logger.js';
import { asyncHandler, errorHandler, notFound } from './middleware/error-handler.js';
import { publicLimiter, signInLimiter } from './middleware/rate-limit.js';
import { securityHeaders } from './middleware/security-headers.js';
import { UnauthorizedError, ForbiddenError, NotFoundError } from './utils/errors.js';
import {
  contactSchema, quoteSchema, createShipmentSchema, updateShipmentSchema,
  addEventSchema, trackingParamsSchema, idParamSchema, validateBody
} from './schemas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const app = express();

/* ------------------------- global middleware stack ------------------------ */
/* Better Auth MUST be mounted BEFORE express.json() — it reads raw bodies. */

// Trust Vercel's (and local dev's) proxy hop so req.ip reflects the real client
// IP — this is what the rate limiters key on. Without it every visitor shares
// the proxy's IP and the limiters would be effectively global.
app.set('trust proxy', 1);

app.use(requestLogger);
app.use(compression());
app.use(securityHeaders);

// Login endpoint gets a dedicated brute-force limiter on top of Better Auth's
// own per-IP throttle (3 per 10 s). Mounted before the auth catch-all below.
app.post('/api/auth/sign-in/email', signInLimiter, toNodeHandler(auth));
app.all('/api/auth/*', toNodeHandler(auth));
app.use(express.json({ limit: '100kb' }));
// Guard against requests without a JSON body (req.body is undefined otherwise)
app.use((req, _res, next) => {
  req.body = req.body ?? {};
  next();
});

/* ------------------------------ auth guards ----------------------------- */

async function requireAuth(req: express.Request, _res: express.Response, next: express.NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedError();
    if (session.user.role !== 'admin') throw new ForbiddenError('Administrator access required.');
    next();
  } catch (err) {
    next(err);
  }
}

/* ------------------------------ public routes --------------------------- */

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'TPC Logistics API', time: new Date().toISOString() });
});

app.get(
  '/api/track/:trackingId',
  asyncHandler((req, res) => {
    const { trackingId } = validateBody(trackingParamsSchema, req.params);
    const id = trackingId.toUpperCase();

    const shipment = findShipment(id);
    if (!shipment) throw new NotFoundError(`No shipment found for "${id}". Double-check the ID and try again.`);
    res.json(shipmentToJson(shipment));
  })
);

app.post(
  '/api/contact',
  publicLimiter,
  asyncHandler((req, res) => {
    const { name, email, phone, subject, message } = validateBody(contactSchema, req.body);
    db.prepare('INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)').run(
      name, email, phone || null, subject || null, message
    );
    res.status(201).json({ ok: true, message: 'Message received — our team will reply within one business day.' });
  })
);

app.post(
  '/api/quote',
  publicLimiter,
  asyncHandler((req, res) => {
    const { name, company, email, phone, service, origin, destination, weight, note } = validateBody(quoteSchema, req.body);
    db.prepare(
      `INSERT INTO quotes (name, company, email, phone, service, origin, destination, weight, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(name, company || null, email, phone || null, service || null, origin || null, destination || null, weight || null, note || null);
    res.status(201).json({ ok: true, message: 'Quote request received — expect a tailored quote within 24 hours.' });
  })
);

/* ------------------------------ admin: inbox ----------------------------- */

app.get('/api/admin/messages', requireAuth, (_req, res) => {
  const rows = db.prepare(
    'SELECT id, name, email, phone, subject, message, handled, handled_at, created_at FROM messages ORDER BY handled ASC, id DESC'
  ).all();
  res.json(rows);
});

app.post('/api/admin/messages/:id/toggle', requireAuth, asyncHandler((req, res) => {
  const { id } = validateBody(idParamSchema, req.params);
  const result = db.prepare(
    "UPDATE messages SET handled = CASE WHEN handled THEN 0 ELSE 1 END, handled_at = CASE WHEN handled THEN NULL ELSE datetime('now') END WHERE id = ?"
  ).run(id);
  if (result.changes === 0) throw new NotFoundError('Message not found.');
  res.json({ ok: true });
}));

app.delete('/api/admin/messages/:id', requireAuth, asyncHandler((req, res) => {
  const { id } = validateBody(idParamSchema, req.params);
  const result = db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  if (result.changes === 0) throw new NotFoundError('Message not found.');
  res.json({ ok: true });
}));

app.get('/api/admin/quotes', requireAuth, (_req, res) => {
  const rows = db.prepare(
    `SELECT id, name, company, email, phone, service, origin, destination, weight, note,
            handled, handled_at, created_at
     FROM quotes ORDER BY handled ASC, id DESC`
  ).all();
  res.json(rows);
});

app.post('/api/admin/quotes/:id/toggle', requireAuth, asyncHandler((req, res) => {
  const { id } = validateBody(idParamSchema, req.params);
  const result = db.prepare(
    "UPDATE quotes SET handled = CASE WHEN handled THEN 0 ELSE 1 END, handled_at = CASE WHEN handled THEN NULL ELSE datetime('now') END WHERE id = ?"
  ).run(id);
  if (result.changes === 0) throw new NotFoundError('Quote not found.');
  res.json({ ok: true });
}));

app.delete('/api/admin/quotes/:id', requireAuth, asyncHandler((req, res) => {
  const { id } = validateBody(idParamSchema, req.params);
  const result = db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
  if (result.changes === 0) throw new NotFoundError('Quote not found.');
  res.json({ ok: true });
}));

/* --------------------------- admin: shipments ---------------------------- */

const formatNow = (): string =>
  new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).replace(',', ' ·');

function nextTrackingId(): string {
  const year = new Date().getFullYear();
  const rows = db.prepare('SELECT tracking_id FROM shipments').all() as { tracking_id: string }[];
  let max = 1000;
  for (const row of rows) {
    const match = String(row.tracking_id).match(/TPC-\d+-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `TPC-${year}-${max + 1}`;
}

const getShipment = (id: number): ShipmentRow => {
  const shipment = db.prepare('SELECT * FROM shipments WHERE id = ?').get(id) as ShipmentRow | undefined;
  if (!shipment) throw new NotFoundError('Shipment not found.');
  return shipment;
};

app.get('/api/admin/shipments', requireAuth, (_req, res) => {
  const rows = db.prepare(
    `SELECT id, tracking_id, customer, cargo, origin, destination, weight, mode, status, eta, created_at
     FROM shipments ORDER BY id DESC`
  ).all() as { id: number }[];
  const counts = db.prepare(
    'SELECT shipment_id, COUNT(*) AS n FROM shipment_events GROUP BY shipment_id'
  ).all() as { shipment_id: number; n: number }[];
  const countMap = Object.fromEntries(counts.map((c) => [c.shipment_id, c.n]));
  res.json(rows.map((s) => ({ ...s, eventCount: countMap[s.id] || 0 })));
});

app.post('/api/admin/shipments', requireAuth, asyncHandler((req, res) => {
  const data = validateBody(createShipmentSchema, req.body);

  const trackingId = nextTrackingId();
  const happenedAt = formatNow();
  const result = db.prepare(
    `INSERT INTO shipments (tracking_id, customer, customer_email, cargo, origin, destination, weight, mode, status, eta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    trackingId, data.customer, data.customer_email || null, data.cargo,
    data.origin, data.destination, data.weight, data.mode, 'Registered',
    `Est. ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
  );

  const shipment = getShipment(Number(result.lastInsertRowid));
  db.prepare(
    'INSERT INTO shipment_events (shipment_id, status, location, note, happened_at) VALUES (?, ?, ?, ?, ?)'
  ).run(shipment.id, 'Registered', shipment.origin, 'Shipment registered via TPC ops portal', happenedAt);

  sendShipmentUpdateEmail(shipment, {
    status: 'Registered', location: shipment.origin,
    note: 'Shipment registered via TPC ops portal', happened_at: happenedAt
  });

  res.status(201).json(shipmentToJson(shipment));
}));

app.get('/api/admin/shipments/:id', requireAuth, asyncHandler((req, res) => {
  const { id } = validateBody(idParamSchema, req.params);
  res.json(shipmentToJson(getShipment(id)));
}));

app.patch('/api/admin/shipments/:id', requireAuth, asyncHandler((req, res) => {
  const { id } = validateBody(idParamSchema, req.params);
  getShipment(id); // 404 check
  const data = validateBody(updateShipmentSchema, req.body);

  const updates: string[] = [];
  const values: (string | number)[] = [];
  for (const [field, value] of Object.entries(data)) {
    updates.push(`${field} = ?`);
    values.push(value);
  }
  if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update.' });

  values.push(id);
  db.prepare(`UPDATE shipments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(shipmentToJson(getShipment(id)));
}));

app.post('/api/admin/shipments/:id/events', requireAuth, asyncHandler((req, res) => {
  const { id } = validateBody(idParamSchema, req.params);
  const shipment = getShipment(id);
  const { status, location, note, eta } = validateBody(addEventSchema, req.body);

  const happenedAt = formatNow();
  db.prepare(
    'INSERT INTO shipment_events (shipment_id, status, location, note, happened_at) VALUES (?, ?, ?, ?, ?)'
  ).run(shipment.id, status, location, note || null, happenedAt);

  // Derive ETA text
  let nextEta = shipment.eta;
  if (status === 'Delivered') {
    nextEta = `Delivered ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  } else if (eta) {
    nextEta = eta;
  } else if (!shipment.eta) {
    nextEta = `Est. ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
  }

  db.prepare('UPDATE shipments SET status = ?, eta = ? WHERE id = ?').run(status, nextEta, shipment.id);

  sendShipmentUpdateEmail(getShipment(shipment.id), { status, location, note, happened_at: happenedAt });
  res.json(shipmentToJson(getShipment(shipment.id)));
}));

app.delete('/api/admin/shipments/:id', requireAuth, asyncHandler((req, res) => {
  const { id } = validateBody(idParamSchema, req.params);
  getShipment(id); // 404 check
  db.prepare('DELETE FROM shipment_events WHERE shipment_id = ?').run(id);
  db.prepare('DELETE FROM notifications WHERE shipment_id = ?').run(id);
  db.prepare('DELETE FROM shipments WHERE id = ?').run(id);
  res.json({ ok: true });
}));

/* ------------------------- admin: notifications ------------------------- */

app.get('/api/admin/shipments/:id/notifications', requireAuth, asyncHandler((req, res) => {
  const { id } = validateBody(idParamSchema, req.params);
  getShipment(id); // 404 check
  const rows = db.prepare(
    `SELECT id, recipient, subject, provider, status, error, created_at
     FROM notifications WHERE shipment_id = ? ORDER BY id DESC LIMIT 50`
  ).all(id);
  res.json(rows);
}));

/* --------------------------- seed admin user ---------------------------- */

const adminEmail = (): string =>
  (process.env.ADMIN_EMAIL || 'admin@tpclogistics.com').trim().toLowerCase();

/** The ADMIN_PASSWORD env value, or undefined when unset. */
const adminPasswordFromEnv = (): string | undefined =>
  process.env.ADMIN_PASSWORD?.trim() || undefined;

/** Strong one-time password used when ADMIN_PASSWORD is not configured. */
const randomPassword = (): string => randomBytes(18).toString('base64url');

interface AuthContext {
  generateId: (opts: { model: string; size: number }) => string;
  password: { hash: (password: string) => Promise<string> };
  internalAdapter: {
    createUser: (user: Record<string, unknown>) => Promise<unknown>;
    createAccount: (account: Record<string, unknown>) => Promise<unknown>;
  };
}

/**
 * Ensures the admin account exists. Uses Better Auth's internal adapter
 * directly (with its own password hashing) because public sign-up is
 * disabled — signUpEmail cannot be used to create the seed account.
 *
 * There is deliberately NO hardcoded default password:
 * - If ADMIN_PASSWORD is set, it is authoritative — re-asserted on every boot
 *   so rotation via env actually takes effect.
 * - If it is unset and the account is created, a strong random one-time
 *   password is generated and logged once, at creation time only.
 */
export async function seedAdmin(): Promise<void> {
  const email = adminEmail();
  const envPassword = adminPasswordFromEnv();
  const ctx = (await auth.$context) as unknown as AuthContext;

  const existing = db.prepare('SELECT id, role FROM user WHERE email = ?').get(email) as { id: string; role: string } | undefined;

  if (existing) {
    if (existing.role !== 'admin') db.prepare("UPDATE user SET role = 'admin' WHERE id = ?").run(existing.id);
    if (envPassword) {
      const hash = await ctx.password.hash(envPassword);
      const result = db
        .prepare("UPDATE account SET password = ? WHERE userId = ? AND providerId = 'credential'")
        .run(hash, existing.id);
      // User exists but has no credential account row (legacy DB) — create one.
      if (result.changes === 0) {
        const now = new Date();
        await ctx.internalAdapter.createAccount({
          id: ctx.generateId({ model: 'account', size: 32 }),
          userId: existing.id,
          accountId: existing.id,
          providerId: 'credential',
          issuer: 'local:credential',
          password: hash,
          createdAt: now,
          updatedAt: now
        });
      }
      logger.info({ email }, 'admin password synced from ADMIN_PASSWORD');
    }
    return;
  }

  const password = envPassword || randomPassword();
  const userId = ctx.generateId({ model: 'user', size: 32 });
  const now = new Date();
  await ctx.internalAdapter.createUser({
    id: userId,
    name: 'TPC Admin',
    email,
    emailVerified: false,
    createdAt: now,
    updatedAt: now,
    role: 'admin'
  });
  await ctx.internalAdapter.createAccount({
    id: ctx.generateId({ model: 'account', size: 32 }),
    userId,
    accountId: userId,
    providerId: 'credential',
    issuer: 'local:credential',
    password: await ctx.password.hash(password),
    createdAt: now,
    updatedAt: now
  });
  if (envPassword) {
    logger.info({ email }, 'seeded admin user from ADMIN_PASSWORD');
  } else {
    logger.warn(
      { email, password },
      'seeded admin user with a generated one-time password — set ADMIN_PASSWORD to control it'
    );
  }
}

/* --------------------------- serve built client -------------------------- */

// Resolve client/dist for both layouts: dev (server/app.ts) and compiled
// (server/dist/app.js) — the naive ../client/dist breaks under the latter.
const dist = [
  join(__dirname, '..', '..', 'client', 'dist'), // client/dist/ from compiled server/dist/
  join(__dirname, '..', 'client', 'dist'),        // client/dist/ from source server/
  join(__dirname, '..', '..', 'dist'),             // root dist/ from compiled server/dist/
  join(__dirname, '..', 'dist')                    // root dist/ from source server/
].find((candidate) => existsSync(candidate));
if (dist) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(dist, 'index.html')));
}

/* ------------------------------ 404 + errors ----------------------------- */

app.use('/api', notFound);
app.use(errorHandler);
