# How authentication works

> **Diátaxis type:** Explanation (understanding)
> **Related reference:** [Environment variables](../reference/environment-variables.md)

## The one account

There is exactly one human behind the admin console: the TPC Logistics admin. There is no
self-service registration — `disableSignUp: true` in the Better Auth config, which was
verified blocked during migration. The account is created by `seedAdmin` on the server's
first boot from the `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables.

So authentication is intentionally minimal: one user, one role, one password. The machinery
underneath is still real, and worth understanding because it explains the login screen's
quirks (the demo hint, the origin check, the settings page).

## The auth library: Better Auth

TPC uses [Better Auth](https://better-auth.com) with two plugins configured in
`server/auth.ts`:

- **emailAndPassword** — password sign-in. `minPasswordLength: 8`, and sign-up disabled.
- **admin** — adds the `role` column to the user table and lets us mark the seeded account
  as `admin`.

Better Auth owns four database tables (`user`, `session`, `account`, `verification`) and is
mounted into Express at `/api/auth/*` via `toNodeHandler` **before** `express.json()` (it
reads raw request bodies). It also ships its own rate limiting (100 requests / 60 s by
default in this config).

## The session cookie

When you sign in, Better Auth:

1. Looks up the `user` row by email.
2. Verifies the password against the hash in the matching `account` row.
3. Creates a `session` row and returns its `token`.
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

This is also why a "reset" is a database operation, not a config change after first boot:
see [Reset the admin password](../how-to/reset-admin-password.md).

## The demo-password hint

The login screen shows "default credentials still in use" guidance until the admin changes
the password. Mechanically, the client calls `GET /api/admin/setup-status` (unauthenticated)
on load. The server:

1. Reads the *current* `ADMIN_EMAIL`/`ADMIN_PASSWORD` (or their defaults).
2. Attempts a real `signInEmail` with them.
3. Deletes the probe's session row (it must not leak sessions into the table).
4. Returns `{ defaultPasswordInUse: true | false }`.

The hint disappears automatically the moment the password no longer matches the default —
no manual flag to flip.

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
