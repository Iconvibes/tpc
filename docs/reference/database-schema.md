# Database schema reference

> **Diátaxis type:** Reference (information)
> **File:** `server/data/tpc.db` (default; override with `DB_PATH`).
> **Engine:** SQLite, WAL mode, foreign keys ON. Schema is created idempotently on boot by
> `server/db.ts` — no migration CLI is required for a fresh database.

## Overview

Nine tables in two groups:

**Application tables** (domain data):

- `shipments` — the cargo shipments with public tracking IDs
- `shipment_events` — the timeline milestones for a shipment
- `messages` — contact-form submissions
- `quotes` — quote-request submissions
- `notifications` — email send attempts

**Better Auth tables** (authentication):

- `user` — accounts (one admin)
- `session` — login sessions
- `account` — credentials (password hash lives here)
- `verification` — verification codes (unused with email verification off)

## Relationships

```
shipments 1───* shipment_events
shipments 1───* notifications
user      1───* session        (cascade delete)
user      1───* account        (cascade delete)
```

---

## Application tables

### `shipments`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | autoincrement |
| `tracking_id` | TEXT UNIQUE NOT NULL | `TPC-<year>-<number>` (e.g. `TPC-2026-1077`) |
| `customer` | TEXT NOT NULL | |
| `customer_email` | TEXT | nullable |
| `cargo` | TEXT NOT NULL | |
| `origin` | TEXT NOT NULL | |
| `destination` | TEXT NOT NULL | |
| `weight` | TEXT NOT NULL | free text, e.g. `1,150 kg` |
| `mode` | TEXT NOT NULL | `Air`, `Sea`, or `Road` (validated by the API, not the DB) |
| `status` | TEXT NOT NULL | free text; the admin UI offers `Registered`…`Delivered` |
| `eta` | TEXT | human text like `Est. Aug 8, 2026` or `Delivered Aug 2, 2026` |
| `created_at` | TEXT | `datetime('now')` |

Seeded with six demo shipments when the table is empty.

### `shipment_events`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | autoincrement |
| `shipment_id` | INTEGER NOT NULL → `shipments(id)` | |
| `status` | TEXT NOT NULL | |
| `location` | TEXT NOT NULL | |
| `note` | TEXT | nullable |
| `happened_at` | TEXT NOT NULL | formatted, e.g. `Aug 6, 2026 · 05:20` |

Ordered by `id` (oldest → newest) when read.

### `messages`

Contact-form rows (`POST /api/contact`).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | autoincrement |
| `name` | TEXT NOT NULL | |
| `email` | TEXT NOT NULL | |
| `phone` | TEXT | nullable |
| `subject` | TEXT | nullable |
| `message` | TEXT NOT NULL | |
| `handled` | INTEGER NOT NULL DEFAULT 0 | 0 = new, 1 = handled |
| `handled_at` | TEXT | set/cleared on toggle |
| `created_at` | TEXT | `datetime('now')` |

### `quotes`

Quote-request rows (`POST /api/quote`). Same columns as `messages` **plus**:

| Column | Type | Notes |
| --- | --- | --- |
| `company` | TEXT | nullable |
| `service` | TEXT | nullable |
| `origin` | TEXT | nullable |
| `destination` | TEXT | nullable |
| `weight` | TEXT | nullable |
| `note` | TEXT | nullable |

### `notifications`

One row per email attempt (console fallback or Resend).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | autoincrement |
| `shipment_id` | INTEGER NOT NULL → `shipments(id)` | |
| `recipient` | TEXT NOT NULL | customer email |
| `subject` | TEXT NOT NULL | e.g. `TPC-2026-1091 — In Transit: Ore, Ondo` |
| `provider` | TEXT NOT NULL | `resend` or `console` |
| `status` | TEXT NOT NULL | `sent`, `logged`, or `error` |
| `error` | TEXT | reason when `status = 'error'` |
| `created_at` | TEXT | `datetime('now')` |

---

## Better Auth tables

Created verbatim by Better Auth (`npm run setup` CLI or self-contained in `db.ts`). Standard
columns, documented by Better Auth. The important one for admin auth:

### `account`

Holds the password hash for the email/password provider.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | TEXT PK | |
| `accountId` | TEXT NOT NULL | |
| `providerId` | TEXT NOT NULL | `credential` for email/password |
| `userId` | TEXT NOT NULL → `user(id)` | cascade delete |
| `password` | TEXT | Better Auth's `salt:key` scrypt hash — see [Reset the admin password](../how-to/reset-admin-password.md) |

### `user`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | TEXT PK | |
| `name` | TEXT NOT NULL | `TPC Admin` (seeded) |
| `email` | TEXT NOT NULL UNIQUE | |
| `emailVerified` | INTEGER NOT NULL | `0` for the seed; verification not enforced |
| `role` | TEXT | `admin` — checked by the API's `requireAuth` guard |
| `banned`, `banReason`, `banExpires` | | admin-plugin columns, unused |

### `session`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | TEXT PK | |
| `token` | TEXT NOT NULL UNIQUE | the value inside the session cookie |
| `expiresAt` | DATE NOT NULL | |
| `userId` | TEXT NOT NULL → `user(id)` | cascade delete |
| `ipAddress`, `userAgent`, `impersonatedBy` | | metadata |

### `verification`

Unused with email verification disabled; present for Better Auth compatibility.

---

## Migrations

The schema is forward-compatible with pre-Better-Auth databases:

- Missing columns on `shipments`/`messages`/`quotes` (`customer_email`, `handled`, `handled_at`)
  are added with `ALTER TABLE`.
- A legacy `created_by` column on `shipments` is dropped by rebuilding the table.
- Dangling foreign keys (from an old broken migration path) are repaired on boot.
- Legacy `admin_users` / `sessions` tables are dropped.

All of this is idempotent and safe to run on every boot — it no-ops on a clean database.

## Working with the database

```bash
# in server/
node -e "
const Database = require('better-sqlite3');
const db = new Database('data/tpc.db');
console.table(db.prepare('SELECT tracking_id, customer, status FROM shipments').all());
"
```

To reset everything: stop the server and delete `data/tpc.db` (plus `-wal`/`-shm`); the
schema, demo shipments, and admin user are re-created on next boot.
