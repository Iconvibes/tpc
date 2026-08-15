# How authentication works

> **Diátaxis type:** Explanation (understanding)
> **Related reference:** [Environment variables](../reference/environment-variables.md)

## The one account

There is exactly one human behind the admin console: the TPC Logistics admin. There is no
self-service registration — `disableSignUp: true` in the Better Auth config, which was
verified blocked during migration. The account is created by `seedAdmin` on the server's
first boot from the `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables.

There is deliberately **no default password**. When `ADMIN_PASSWORD` is set it is
authoritative — `seedAdmin` re-asserts it on every boot, so rotating it in env actually
rotates the admin password (important because the free-tier filesystem is ephemeral and
Settings changes don't survive a redeploy). When `ADMIN_PASSWORD` is unset and the account
is created, a strong random one-time password is generated and printed to the server log
once, at creation time.

So authentication is intentionally minimal: one user, one role, one password. The machinery
underneath is still real, and worth understanding because it explains the login screen's
behavior (the origin check, the settings page).

## The auth library: Better Auth

TPC uses [Better Auth](https://better-auth.com) with two plugins configured in
`server/auth.ts`:

- **emailAndPassword** — password sign-in. `minPasswordLength: 8`, and sign-up disabled.
- **admin** — adds the `role` column to the user table and lets us mark the seeded account
  as `admin`.

Better Auth owns four database tables (`user`, `session`, `account`, `verification`) and is
mounted into Express at `/api/auth/*` via `toNodeHandler` **before** `express.json()` (it
reads raw request bodies). It ships its own rate limiting (60 requests / 60 s in this
config), and applies a stricter built-in rule to high-risk paths: sign-in, sign-up and
change-password are capped at 3 requests per 10 seconds per IP. On top of that, Express
mounts a dedicated limiter on `POST /api/auth/sign-in/email` — 10 attempts per 15 minutes
per IP — so a brute-force campaign can't hammer the password endpoint all day.

## The session cookie

When you sign in, Better Auth:

1. Looks up the `user` row by email.
2. Verifies the password against the hash in the matching `account` row.
3. Creates a `session` row (24-hour expiry, refreshed at most every 8 hours) and returns its
   `token`.
4. Sets the `better-auth.session_token` cookie (httpOnly, same-site, `Secure` when
   `COOKIE_SECURE=true`) on the browser.

On every admin API call, the client sends that cookie. The `requireAuth` middleware in
`server/app.ts` calls `auth.api.getSession({ headers })` — Better Auth validates the cookie
against the `session` table and returns the user — then checks `session.user.role === 'admin'`:

- no session → `401 Unauthorized`
- session but not admin → `403 Forbidden` (the role check is defensive; no other roles exist)

Signing out (`signOut`) deletes the session row, killing the cookie server-side.

## The CSRF origin check

Better Auth rejects state-changing requests whose `Origin` header isn't in its
`trustedOrigins` list. This is why:

- The dev client works through the Vite proxy — requests look same-origin to the browser.
  The default trusted origin is `http://localhost:5173`, **replaced by** `BETTER_AUTH_URL`
  when that variable is set (it's an either/or, not a union).
- In production you **must** set `BETTER_AUTH_URL` to your real origin; otherwise every
  login returns a CSRF error. `http://localhost:<API_PORT>` is trusted in addition when
  `API_PORT` is set, which is what makes local `curl` testing possible.

## Where the password lives

The password is never stored. The `account` table stores Better Auth's scrypt hash
(`salt:key` format). `seedAdmin` uses Better Auth's **internal adapter** (`auth.$context`)
to create the user and account with its own hashing function — it does not hand-roll a hash,
so the seeded password verifies identically to one set later in Settings.

Because `ADMIN_PASSWORD` is re-asserted on every boot, resetting the admin password is as
simple as changing it in env and restarting — no database surgery needed. If the DB has been
destroyed entirely, the server re-seeds the account from env on next boot. See
[Reset the admin password](../how-to/reset-admin-password.md).

## No demo credentials, anywhere

There is no default password and no "demo credentials" hint on the login screen. An earlier
version exposed `GET /api/admin/setup-status`, which anonymously probed whether the default
password still worked — a gift to anyone trying to break in. It was removed: the login page
reveals nothing except the email and password fields, and the only way in is a real sign-in
against the actual password hash.

## Why it's built this way

- **One admin, one path:** fewer moving parts means fewer ways to get locked out or
  compromised.
- **Library, not DIY:** password hashing, cookie handling, CSRF, and session storage are the
  kind of code you don't write yourself — Better Auth is maintained and audited.
- **Defense in depth:** even though the admin role is the only role, `requireAuth` checks it
  explicitly, sign-up is disabled, and the public forms are rate-limited separately.

## Related

- [The tracking pipeline](the-tracking-pipeline.md) — the public half of the system, which
  needs no auth at all.
- [API reference: auth endpoints](../reference/api.md)
