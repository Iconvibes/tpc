# Environment variables reference

> **Diátaxis type:** Reference (information)
> **Where:** `server/.env` (copy from `server/.env.example`). Loaded by the server on boot.

---

## Auth

### `BETTER_AUTH_SECRET` — **required in production**

Secret used by Better Auth to sign session cookies. Generate with
`openssl rand -base64 32`. Without it, sessions are not safe for production use.

### `BETTER_AUTH_URL`

Default: `http://localhost:5173`

The public origin (scheme + host, **no trailing slash**) used as a trusted origin for
Better Auth's CSRF check, e.g. `https://track.tpclogistics.com`. The default trusted
origin is `http://localhost:5173`, **replaced by** this variable when set (an either/or,
not a union). `http://localhost:<API_PORT>` is trusted in addition when `API_PORT` is set.

### `COOKIE_SECURE`

Default: unset (false)

Set to `true` when the site runs behind HTTPS. Makes session cookies
`Secure` (sent only over HTTPS). Leaving it `false` on an HTTPS site lets cookies work but
is less safe; leaving it `true` on plain `http` breaks login.

---

## Admin seed account

### `ADMIN_EMAIL`

Default: `admin@tpclogistics.com`

Email for the admin account **created on first boot** (`seedAdmin`). Only read when no user
with that email exists yet.

### `ADMIN_PASSWORD`

Default: unset (a random password is generated on first boot)

Password for the admin account. **There is no default password.** When set, it is
authoritative: `seedAdmin` re-asserts it on every boot, so changing it in env rotates the
admin password reliably (even when the filesystem is ephemeral, as on Render's free tier).
When unset, the server generates a strong random one-time password on first boot and prints
it to the log — after that the account keeps whatever password it was given.

---

## Server

### `API_PORT`

Default: `5000`

Port the Express server listens on. The Vite dev client proxies `/api/*` to this port.

### `NODE_ENV`

Default: unset (dev)

Set `production` to hide internal error messages from API responses and to switch log level
defaults (see `LOG_LEVEL`). `npm start` does **not** set this for you — set it in the
process environment on your server.

### `DB_PATH`

Default: `server/data/tpc.db`

Filesystem path for the SQLite database. The test suite overrides this for isolation.

### `LOG_LEVEL`

Default: `debug` in dev, `info` in production

pino log level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent`).

---

## Email notifications

### `RESEND_API_KEY`

Default: unset

When set, status-update emails are sent through the Resend API. When unset, emails are
printed to the server console (dev fallback). See
[Enable email notifications](../how-to/enable-email-notifications.md).

### `RESEND_FROM`

Default: `TPC Logistics <onboarding@resend.dev>`

Sender address for outgoing emails. In Resend test mode use the default; on a verified
domain use something like `TPC Logistics <notifications@tpclogistics.com>`.

### `SITE_URL`

Default: `http://localhost:5173`

Public base URL used to build the **Track your shipment** link inside emails.

---

## Rate limiting (public forms)

### `RATE_LIMIT_MAX`

Default: `60`

Maximum requests per IP per window on `POST /api/contact` and `POST /api/quote`.

### `RATE_LIMIT_WINDOW_MS`

Default: `900000` (15 minutes)

Window length in milliseconds.

---

## Full list

| Variable | Default | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | — | Signs session cookies (required in production) |
| `BETTER_AUTH_URL` | `http://localhost:5173` | Public origin for CSRF trust |
| `COOKIE_SECURE` | unset | `true` behind HTTPS |
| `ADMIN_EMAIL` | `admin@tpclogistics.com` | Admin email (first boot only) |
| `ADMIN_PASSWORD` | unset | Admin password (authoritative when set; random one-time password otherwise) |
| `API_PORT` | `5000` | Express listen port |
| `NODE_ENV` | unset | `production` toggles error/log behavior |
| `DB_PATH` | `server/data/tpc.db` | SQLite file location |
| `LOG_LEVEL` | debug/info | pino verbosity |
| `RESEND_API_KEY` | unset | Enables real email delivery |
| `RESEND_FROM` | `TPC Logistics <onboarding@resend.dev>` | Outgoing sender |
| `SITE_URL` | `http://localhost:5173` | Email track-link base |
| `RATE_LIMIT_MAX` | `60` | Public-form request cap per window |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate-limit window (ms) |
