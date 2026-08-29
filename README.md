# TPC Logistics — Full-stack Website

A full-stack marketing + tracking website for **TPC Logistics Company** (Ikeja, Lagos).

## Documentation

A full documentation suite lives in [`docs/`](docs/README.md), organized by the **Diátaxis**
framework — four quadrants split by what you're trying to do:

| Quadrant        | Question it answers | You want this when…                          |
| --------------- | ------------------- | -------------------------------------------- |
| [**Tutorials**](docs/tutorials/your-first-shipment.md) | *Learning* — what does this do? | You want to see the whole thing work, step by step. |
| [**How-to**](docs/how-to/) | *Task* — how do I do a specific thing? | You have a concrete job: deploy, enable email, reset a password. |
| [**Reference**](docs/reference/) | *Information* — what are the exact facts? | You need precise details: an endpoint, a variable, a table. |
| [**Explanation**](docs/explanation/) | *Understanding* — how does this fit together? | You want to reason about the system, not just use it. |

New here? Start with the [tutorial](docs/tutorials/your-first-shipment.md) — it takes you from
`npm install` to a shipment you created yourself, tracked live, with a status email at the end.

## Stack

- **Frontend:** React 18 + Vite, React Router, hand-crafted design system (no UI framework)
- **Backend:** Node.js + Express + **TypeScript**, SQLite via `better-sqlite3`, structured logging (pino), Zod validation, compression, rate limiting
- **Auth:** Better Auth (email/password + admin role plugin) — SQLite-backed sessions, httpOnly cookies, built-in rate limiting
- **Dev tooling:** npm workspaces (one command runs both servers)

## Backend architecture

- `server/app.ts` — importable Express assembly (middleware stack, Better Auth mount, routes, static serving, 404 + global error handler)
- `server/index.ts` — boot + graceful shutdown (drains connections, closes the DB)
- `server/utils/` — `AppError` hierarchy (`errors.ts`) and pino structured logger (`logger.ts`)
- `server/middleware/` — global error handler + `asyncHandler`, and the public rate limiter
- `server/schemas.ts` — Zod schemas for every body/param; invalid input returns 400 with a `{ field: message }` map
- `server/tests/api.test.ts` — integration tests (node:test + supertest, isolated temp DB)

Every API request is logged with method, path, status and duration. The public contact/quote
endpoints are rate-limited (60 requests / 15 min / IP, tunable via `RATE_LIMIT_MAX` and
`RATE_LIMIT_WINDOW_MS`). `LOG_LEVEL` controls log verbosity; logs are pretty-printed in dev.

## Features

- Marketing site: Home, Services, About, Contact — with hero, animated stats, services bento grid, testimonials
- **Real-time shipment tracking** — `GET /api/track/:id` returns shipment details + milestone timeline (demo shipments seeded on first run)
- **Admin console at `/admin`** — password-protected dashboard:
  - Overview with live stats (unread messages, quotes, active shipments)
  - Inbox for contact messages + quote requests (mark handled, reply by email, delete)
  - Shipment management: create shipments (auto-generated tracking IDs), update status with location/notes, edit details, delete
  - Settings: change the admin password
- **Contact form** → saved to SQLite (`POST /api/contact`)
- **Quote request modal** → saved to SQLite (`POST /api/quote`)
- WhatsApp integration (`https://wa.me/2348022550250`), click-to-call & email links

## Admin console

Visit `/admin` and sign in. On first run the server seeds one admin account:

- **Email:** `admin@tpclogistics.com` (set `ADMIN_EMAIL` to override)
- **Password:** whatever `ADMIN_PASSWORD` is set to — there is **no default**. If
  `ADMIN_PASSWORD` is unset, a strong random one-time password is generated and printed to
  the server log at creation time.

> `ADMIN_PASSWORD` is authoritative: when set, the server re-asserts it on every boot (so
> changing it in env rotates the password reliably, even with an ephemeral filesystem). You
> can also rotate it from the console (Admin → Settings). Auth is powered by Better Auth:
> hashed passwords, SQLite-backed httpOnly session cookies (24h expiry), CSRF origin
> checks, and layered rate limiting on sign-in.

Every status update made in the console appears instantly on the public tracking page.

## Email notifications

When an admin creates a shipment or updates its status, TPC sends the customer a branded
HTML tracking-update email (if a customer email is set on the shipment).

- **Resend (production):** set `RESEND_API_KEY` and optionally `RESEND_FROM`
  (default `TPC Logistics <onboarding@resend.dev>`). Emails are sent via the Resend API.
- **Dev fallback:** without a key, the email is printed to the server console — nothing leaves
  the machine.
- `SITE_URL` (default `http://localhost:5173`) is used to build the "Track your shipment" link
  in emails.

Every send attempt is recorded in the `notifications` table and shown in the shipment drawer
under **Status emails**.

## Getting started

```bash
npm install                 # installs all workspaces
cp server/.env.example server/.env   # set BETTER_AUTH_SECRET etc.
npm run setup --workspace=server    # runs the Better Auth DB migration (first time)
npm run dev                 # runs API on :5000 and client on :5173
```

Open http://localhost:5173

## Tests

```bash
npm test --workspace=server  # 23 integration tests against an isolated temp DB
```

## Production

```bash
npm run build      # typechecks the server + builds the client into client/dist
npm start          # Express serves the API + built client on :5000
```

Set `BETTER_AUTH_URL` to your public origin (e.g. `https://tpc.example.com`) so Better Auth's
CSRF origin check accepts requests from your real domain, and `COOKIE_SECURE=true` behind HTTPS.

## Deploying to Vercel

The app runs on [Vercel](https://vercel.com) as a single deployable unit: a serverless
function wraps the Express app (API + Better Auth), and Vercel serves the built client as
a static site with SPA fallback.

### Quick deploy

1. Push your repo to GitHub/GitLab/Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repository.
3. Vercel auto-detects the framework — click **Deploy** (no config changes needed).
4. After the first deploy, open **Settings → Environment Variables** and add:

| Variable | Value | Notes |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | *(random string)* | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://your-project.vercel.app` | Your Vercel production domain |
| `ADMIN_PASSWORD` | *(strong password)* | Authoritative — re-asserted on every cold start |
| `COOKIE_SECURE` | `true` | Required behind HTTPS |

5. Trigger a redeploy from the Vercel dashboard (or push to main).

### What happens on Vercel

Vercel's filesystem is **ephemeral** — the SQLite database resets on every cold start.
On boot the server re-creates the schema, re-seeds the demo shipments, and re-seeds
the admin account from `ADMIN_PASSWORD`. This is the same behavior as Render's free tier.

### Architecture on Vercel

```
┌─────────────────────────────────────────────┐
│  Vercel Edge Network                        │
│                                             │
│  /api/*  →  serverless function (server/api.ts)
│            ┌──────────────────────────┐     │
│            │ Express app              │     │
│            │  ├── Better Auth (db)    │     │
│            │  ├── Business queries    │────→│ SQLite (ephemeral, re-seeded)
│            │  └── Email via Resend    │────→│ Resend API
│            └──────────────────────────┘     │
│                                             │
│  /*      →  static files (client/dist)      │
│            React SPA with client-side routing│
└─────────────────────────────────────────────┘
```

### Local development

```bash
npm install
cp server/.env.example server/.env   # edit BETTER_AUTH_SECRET, ADMIN_PASSWORD
npm run dev                           # API on :5000, client on :5173
```

## API

### Public

| Method | Route                    | Description                          |
| ------ | ------------------------ | ------------------------------------ |
| GET    | `/api/health`            | Health check                         |
| GET    | `/api/track/:trackingId` | Shipment details + timeline          |
| POST   | `/api/contact`           | Save a contact message               |
| POST   | `/api/quote`             | Save a quote request                 |

### Admin (requires a Better Auth session cookie)

| Method | Route                                  | Description                            |
| ------ | -------------------------------------- | -------------------------------------- |
| POST   | `/api/auth/sign-in/email`              | Sign in with email + password          |
| POST   | `/api/auth/sign-out`                   | Sign out                               |
| GET    | `/api/auth/get-session`                | Current session                        |
| POST   | `/api/auth/change-password`            | Update admin password                  |
| GET    | `/api/auth/ok`                         | Auth health check                      |
| GET    | `/api/admin/messages`                  | List contact messages                  |
| POST   | `/api/admin/messages/:id/toggle`       | Mark handled / new                     |
| DELETE | `/api/admin/messages/:id`              | Delete a message                       |
| GET    | `/api/admin/quotes`                    | List quote requests                    |
| POST   | `/api/admin/quotes/:id/toggle`         | Mark handled / new                     |
| DELETE | `/api/admin/quotes/:id`                | Delete a quote                         |
| GET    | `/api/admin/shipments`                 | List all shipments                     |
| GET    | `/api/admin/shipments/:id`             | Shipment detail + timeline             |
| POST   | `/api/admin/shipments`                 | Create shipment (auto tracking ID)     |
| PATCH  | `/api/admin/shipments/:id`             | Edit shipment fields                   |
| POST   | `/api/admin/shipments/:id/events`      | Add status event (updates public page) |
| DELETE | `/api/admin/shipments/:id`             | Delete shipment                        |

### Data storage

- **Local dev:** everything lives in `server/data/tpc.db` (auto-created, delete to re-seed).
- **Vercel:** same SQLite file, ephemeral — re-seeded on every cold start from env vars.

## Demo tracking IDs

`TPC-2026-1042`, `TPC-2026-1077`, `TPC-2026-1081`, `TPC-2026-1055`, `TPC-2026-1086`, `TPC-2026-1090`
