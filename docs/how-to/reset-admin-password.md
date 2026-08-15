# How to: Reset the admin password

> **Diátaxis type:** How-to (task)
> **Goal:** regain access to `/admin` when the password is lost — or rotate it.

There are three ways, from easiest to most surgical.

## Option 1 — In-app (you're logged in)

1. Sign in to `/admin`.
2. Go to **Settings**.
3. Enter the current password, a new one (at least 8 characters), and confirm.
4. Save. You'll be signed out; sign in with the new password.

## Option 2 — Environment (works at any time)

The admin account is seeded from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server/.env`. There is
**no default password** — if `ADMIN_PASSWORD` is left unset, the server generates a random
one-time password and prints it to the log on first boot.

Setting `ADMIN_PASSWORD` works at any time, not just first boot: `seedAdmin` re-asserts it
on every boot, so it overwrites whatever password the account currently has:

```ini
ADMIN_EMAIL=ops@tpclogistics.com
ADMIN_PASSWORD=<something-strong>
```

Restart the server and sign in with the new password. (This is the easiest path when the
filesystem is ephemeral — e.g. Render free tier — since Settings changes don't survive a
redeploy.)

## Option 3 — Direct database update (locked out)

The password hash is stored in the `account` table (Better Auth's credential provider
record), in Better Auth's hash format. The server can re-hash a password for you using
Better Auth's own hashing function, so the result is guaranteed to verify.

Run this with the server **stopped** (SQLite allows concurrent readers, but a write while
the server holds the connection is racy). Because the server is TypeScript, run the script
with `tsx` (the project's TS runner) — plain `node` cannot import the `.ts` source:

```bash
# in server/
cat > reset-admin-password.mjs <<'EOF'
import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { db } from './db.js';

const NEW_PASSWORD = process.argv[2];
if (!NEW_PASSWORD || NEW_PASSWORD.length < 8) {
  console.error('Usage: npx tsx reset-admin-password.mjs <new-password-8+>');
  process.exit(1);
}

const auth = betterAuth({
  appName: 'TPC Logistics',
  database: db,
  emailAndPassword: { enabled: true },
  plugins: []
});

const email = (process.env.ADMIN_EMAIL || 'admin@tpclogistics.com').trim().toLowerCase();
const ctx = await auth.$context;
const user = db.prepare('SELECT id FROM "user" WHERE email = ?').get(email);

if (!user) {
  console.error(`No user with email ${email} — check ADMIN_EMAIL.`);
  process.exit(1);
}

const hash = await ctx.password.hash(NEW_PASSWORD);
const result = db.prepare('UPDATE account SET password = ? WHERE userId = ? AND providerId = ?')
  .run(hash, user.id, 'credential');
if (result.changes === 0) {
  console.error('No credential account row found for this user — nothing updated.');
  process.exit(1);
}
console.log(`Password updated for ${email}. Existing sessions are invalidated on next use.`);
EOF

npx tsx reset-admin-password.mjs 'Your-New-Password-2026'
rm reset-admin-password.mjs
```

Sign in at `/admin` with the new password. Delete the script afterwards — it embeds a
password in the command line, so it must not be left lying around or committed.

## What to do if you've lost both

1. Use **Option 3** with a fresh password — it needs no existing credentials, only server
   access.
2. Alternatively, delete the database file and let the server re-seed:
   ```bash
   # in server/ — DELETES ALL DATA (shipments, messages, quotes)
   rm data/tpc.db data/tpc.db-wal data/tpc.db-shm
   ```
   The server recreates the schema, seeds the six demo shipments, and re-creates the admin
   from `ADMIN_EMAIL`/`ADMIN_PASSWORD` on next boot.

## Related

- [How authentication works](../explanation/how-authentication-works.md) — what a "password"
  is here, and why the hash lives in `account`.
- [Environment variables reference](../reference/environment-variables.md)
