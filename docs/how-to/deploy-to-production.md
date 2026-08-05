# How to: Deploy to production

> **Diátaxis type:** How-to (task)
> **Goal:** run TPC Logistics on a server so the public can reach it.

The app is a single deployable unit: the Express server both serves the API and the built
client from `client/dist`. You don't need a separate static host or a database server —
SQLite is a file.

## Before you start

- A Linux VM (this guide assumes Debian/Ubuntu) or any host you can run Node on.
- Node.js 20+ and npm.
- A domain pointing at the server (recommended; HTTPS is handled by a reverse proxy).

## Step 1 — Get the code

```bash
git clone <your-repo-url> tpc-logistics
cd tpc-logistics
npm install
```

## Step 2 — Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` for production:

```ini
# REQUIRED — generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=<a-long-random-string>

# Your public origin, WITHOUT a trailing slash
BETTER_AUTH_URL=https://track.tpclogistics.com

# Behind HTTPS, cookies must be secure
COOKIE_SECURE=true

# Keep the default admin unless you changed it before first boot
ADMIN_EMAIL=admin@tpclogistics.com
ADMIN_PASSWORD=<a-strong-password>

API_PORT=5000

# Optional but recommended: real email delivery
RESEND_API_KEY=<your-resend-key>
SITE_URL=https://track.tpclogistics.com
```

> **First-boot rule:** the admin account is created the first time the server starts. If you
> want a non-default admin email/password, set `ADMIN_EMAIL`/`ADMIN_PASSWORD` **before** the
> first boot — changing them later does not re-seed an existing user. See
> [Reset the admin password](reset-admin-password.md) to change it after the fact.

## Step 3 — Build and start

```bash
npm run build        # builds the client into client/dist
npm start            # runs the compiled server (node server/dist/index.js)
```

That's it — the server listens on `API_PORT` (default 5000) and serves:

- the API under `/api/*`
- the built client for every other path (SPA fallback)

Smoke-test locally:

```bash
curl http://localhost:5000/api/health
# {"ok":true,"service":"TPC Logistics API","time":"..."}
curl -s http://localhost:5000/ | head -c 100   # should be <!doctype html>...
```

## Step 4 — Run it as a service

Run the app under a process manager so it survives restarts. Using `pm2`:

```bash
npm install -g pm2
pm2 start npm --name tpc-logistics -- start
pm2 save && pm2 startup   # restart on reboot
```

## Step 5 — Reverse proxy + HTTPS

Use Caddy (zero config, auto-HTTPS) or nginx. Caddy example, in `/etc/caddy/Caddyfile`:

```
track.tpclogistics.com {
    reverse_proxy 127.0.0.1:5000
}
```

```bash
caddy reload
```

Caddy terminates TLS and forwards to the app. Because `BETTER_AUTH_URL` is set to the public
origin and `COOKIE_SECURE=true`, Better Auth accepts the browser's cookie and the CSRF
origin check passes.

With nginx, the equivalent `server` block proxies `location /` to `127.0.0.1:5000` and you
obtain certs with certbot.

## Step 6 — Verify

1. `curl https://track.tpclogistics.com/api/health` → `ok: true`
2. Open the site, sign in at `/admin` with your credentials.
3. Create a test shipment and confirm it appears on `/tracking`.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Login says *Invalid origin* / CSRF error | `BETTER_AUTH_URL` does not match the origin the browser is actually on (protocol + host, no trailing slash). |
| Cookies not saved | You're on plain `http` but `COOKIE_SECURE=true` (or vice versa). Secure cookies require HTTPS. |
| API 500 errors, no static site | The server can't find `client/dist`. Run `npm run build` from the repo root so `client/dist` exists. |
| Port already in use | Set a different `API_PORT` and update the reverse proxy accordingly. |
| Restart loses data | Data lives in `server/data/tpc.db`. Back it up (see below); deleting it re-seeds demo data on next boot. |

## Backups

The whole database is one file: `server/data/tpc.db`. Back it up with the WAL files
(`tpc.db-wal`, `tpc.db-shm`) or checkpoint first. A simple cron backup:

```bash
# sqlite3 CLI, after a clean-ish stop or with WAL checkpointed
cp server/data/tpc.db backups/tpc-$(date +%F).db
```

## Related

- [Environment variables reference](../reference/environment-variables.md)
- [Enable email notifications](enable-email-notifications.md)
