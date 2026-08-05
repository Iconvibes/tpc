import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import request from 'supertest';

/* Isolated DB per run — must be set BEFORE importing the app modules. */
const TEST_DB = join(tmpdir(), `tpc-test-${Date.now()}.db`);
process.env.DB_PATH = TEST_DB;
process.env.LOG_LEVEL = 'silent';
process.env.ADMIN_EMAIL = 'admin@tpclogistics.com';
process.env.ADMIN_PASSWORD = 'tpc-admin-2026';

const { app, seedAdmin } = await import('../app.js');
const { db } = await import('../db.js');

let agent: ReturnType<typeof request.agent>;

before(async () => {
  await seedAdmin();
  agent = request.agent(app);
});

after(() => {
  try { db.close(); } catch { /* already closed */ }
  rmSync(TEST_DB, { force: true });
  rmSync(`${TEST_DB}-shm`, { force: true });
  rmSync(`${TEST_DB}-wal`, { force: true });
});

/* ------------------------------- health -------------------------------- */

test('GET /api/health returns ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});

/* ------------------------------ tracking ------------------------------- */

test('GET /api/track/:id returns a seeded shipment', async () => {
  const res = await request(app).get('/api/track/TPC-2026-1077');
  assert.equal(res.status, 200);
  assert.equal(res.body.trackingId, 'TPC-2026-1077');
  assert.ok(res.body.events.length >= 1);
});

test('GET /api/track/:id 404s for unknown IDs', async () => {
  const res = await request(app).get('/api/track/TPC-9999-0000');
  assert.equal(res.status, 404);
  assert.match(res.body.error, /No shipment found/);
});

test('GET /api/track/:id normalizes lowercase IDs', async () => {
  const res = await request(app).get('/api/track/tpc-2026-1042');
  assert.equal(res.status, 200);
  assert.equal(res.body.trackingId, 'TPC-2026-1042');
});

/* --------------------------- contact / quote --------------------------- */

test('POST /api/contact saves a valid message', async () => {
  const res = await request(app)
    .post('/api/contact')
    .send({ name: 'Test User', email: 'test@example.com', message: 'Hello TPC' });
  assert.equal(res.status, 201);
  assert.equal(res.body.ok, true);
});

test('POST /api/contact rejects missing fields with field details', async () => {
  const res = await request(app).post('/api/contact').send({ name: '' });
  assert.equal(res.status, 400);
  assert.ok(res.body.fields.name);
});

test('POST /api/contact rejects invalid email', async () => {
  const res = await request(app)
    .post('/api/contact')
    .send({ name: 'Test', email: 'not-an-email', message: 'hi' });
  assert.equal(res.status, 400);
});

test('POST /api/quote saves a valid request', async () => {
  const res = await request(app)
    .post('/api/quote')
    .send({ name: 'Shipper', email: 'ship@example.com', origin: 'Lagos', destination: 'London' });
  assert.equal(res.status, 201);
});

test('POST /api/contact with malformed JSON returns 400', async () => {
  const res = await request(app)
    .post('/api/contact')
    .set('Content-Type', 'application/json')
    .send('{not json');
  assert.equal(res.status, 400);
});

/* -------------------------------- auth --------------------------------- */

test('admin routes require a session', async () => {
  const res = await request(app).get('/api/admin/shipments');
  assert.equal(res.status, 401);
  assert.equal(res.body.error, 'Not authenticated.');
});

test('state-changing admin routes reject requests without a session cookie', async () => {
  // Creating a shipment and toggling a message both require an authenticated session.
  const create = await request(app)
    .post('/api/admin/shipments')
    .send({ customer: 'X', cargo: 'Y', origin: 'A', destination: 'B', weight: '1 kg', mode: 'Air' });
  assert.equal(create.status, 401);
  assert.equal(create.body.error, 'Not authenticated.');

  const toggle = await request(app).post('/api/admin/messages/1/toggle');
  assert.equal(toggle.status, 401);
});

test('sign-in with a foreign Origin is rejected (CSRF origin check)', async () => {
  const res = await request(app)
    .post('/api/auth/sign-in/email')
    .set('Origin', 'http://evil.example')
    .send({ email: 'admin@tpclogistics.com', password: 'tpc-admin-2026' });
  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'INVALID_ORIGIN');

  // The rejection creates no session — the origin check fires before any state change.
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM session').get() as { n: number };
  assert.equal(n, 0);
});

test('sign-in with bad credentials is rejected', async () => {
  const res = await request(app)
    .post('/api/auth/sign-in/email')
    .set('Origin', 'http://localhost:5173')
    .send({ email: 'admin@tpclogistics.com', password: 'wrong-password' });
  assert.equal(res.status, 401);
});

test('sign-up is blocked (disableSignUp)', async () => {
  const res = await request(app)
    .post('/api/auth/sign-up/email')
    .set('Origin', 'http://localhost:5173')
    .send({ name: 'Intruder', email: 'intruder@example.com', password: 'hunter2hunter2' });
  // Better Auth validates the body first, then refuses registration.
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'EMAIL_PASSWORD_SIGN_UP_DISABLED');
  assert.match(res.body.message, /not enabled/);

  // The real guarantee: no account row was created. Only the seeded admin exists.
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM user').get() as { n: number };
  assert.equal(n, 1);
});

test('sign-in with good credentials grants admin access', async () => {
  const res = await agent
    .post('/api/auth/sign-in/email')
    .set('Origin', 'http://localhost:5173')
    .send({ email: 'admin@tpclogistics.com', password: 'tpc-admin-2026' });
  assert.equal(res.status, 200);

  const list = await agent.get('/api/admin/shipments');
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.body));
});

test('/api/admin/setup-status reports default password in use', async () => {
  const res = await request(app).get('/api/admin/setup-status');
  assert.equal(res.status, 200);
  assert.equal(res.body.defaultPasswordInUse, true);
});

/* ----------------------------- inbox admin ----------------------------- */

test('admin can list, toggle and delete messages', async () => {
  const list = await agent.get('/api/admin/messages');
  const message = list.body.find((m: { email: string }) => m.email === 'test@example.com');
  assert.ok(message, 'seeded contact message should exist');

  const toggle = await agent.post(`/api/admin/messages/${message.id}/toggle`);
  assert.equal(toggle.status, 200);

  const del = await agent.delete(`/api/admin/messages/${message.id}`);
  assert.equal(del.status, 200);
});

test('toggling a missing message returns 404', async () => {
  const res = await agent.post('/api/admin/messages/999999/toggle');
  assert.equal(res.status, 404);
});

/* -------------------------- shipment lifecycle ------------------------- */

test('admin can create, update and track a shipment end-to-end', async () => {
  const create = await agent
    .post('/api/admin/shipments')
    .send({
      customer: 'Test Corp', cargo: 'Gadgets', origin: 'Lagos', destination: 'Abuja',
      weight: '50 kg', mode: 'Road', customer_email: 'ops@test.example.com'
    });
  assert.equal(create.status, 201);
  const { id, trackingId, status } = create.body;
  assert.equal(status, 'Registered');
  assert.match(trackingId, /^TPC-\d{4}-\d{4}$/);

  // Public tracking sees it immediately
  const track = await request(app).get(`/api/track/${trackingId}`);
  assert.equal(track.status, 200);
  assert.equal(track.body.trackingId, trackingId);

  // Add a status event
  const event = await agent
    .post(`/api/admin/shipments/${id}/events`)
    .send({ status: 'In Transit', location: 'Ore, Ondo', note: 'Truck departed' });
  assert.equal(event.status, 200);
  assert.equal(event.body.status, 'In Transit');
  assert.equal(event.body.events.length, 2);

  // Notifications were recorded via the console fallback provider:
  // one for creation, one for the status update just above.
  const notifs = await agent.get(`/api/admin/shipments/${id}/notifications`);
  assert.equal(notifs.status, 200);
  assert.equal(notifs.body.length, 2);
  assert.ok(notifs.body.every((n: { provider: string }) => n.provider === 'console'));

  // The newest row is the status update — addressed to the customer email
  // on file, logged rather than sent, with the tracking ID in the subject.
  const [latest] = notifs.body;
  assert.equal(latest.recipient, 'ops@test.example.com');
  assert.equal(latest.status, 'logged');
  assert.match(latest.subject, new RegExp(`${trackingId.replace(/[-]/g, '\\-')}.*In Transit`));

  // Patch details
  const patch = await agent.patch(`/api/admin/shipments/${id}`).send({ weight: '60 kg' });
  assert.equal(patch.status, 200);
  assert.equal(patch.body.weight, '60 kg');

  // Delete cleans up
  const del = await agent.delete(`/api/admin/shipments/${id}`);
  assert.equal(del.status, 200);
  const gone = await request(app).get(`/api/track/${trackingId}`);
  assert.equal(gone.status, 404);
});

test('status updates with no customer email are handled gracefully', async () => {
  // No customer_email on purpose — the email must be skipped without error.
  const create = await agent
    .post('/api/admin/shipments')
    .send({
      customer: 'No Mail Co', cargo: 'Documents', origin: 'Lagos', destination: 'Kano',
      weight: '5 kg', mode: 'Air'
    });
  assert.equal(create.status, 201);

  // The status update still succeeds and drives the public tracking page.
  const event = await agent
    .post(`/api/admin/shipments/${create.body.id}/events`)
    .send({ status: 'Delivered', location: 'Kano' });
  assert.equal(event.status, 200);
  assert.equal(event.body.status, 'Delivered');

  // No email on file → nothing recorded, and the update was not an error.
  const notifs = await agent.get(`/api/admin/shipments/${create.body.id}/notifications`);
  assert.equal(notifs.status, 200);
  assert.equal(notifs.body.length, 0);
});

test('creating a shipment with an invalid mode is rejected', async () => {
  const res = await agent
    .post('/api/admin/shipments')
    .send({
      customer: 'X', cargo: 'Y', origin: 'A', destination: 'B',
      weight: '1 kg', mode: 'Rocket'
    });
  assert.equal(res.status, 400);
  assert.ok(res.body.fields.mode);
});
