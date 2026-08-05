# How to: Enable email notifications

> **Diátaxis type:** How-to (task)
> **Goal:** send real branded tracking emails to customers via Resend, replacing the dev
> console fallback.

## Background, briefly

When an admin creates a shipment (with a customer email) or updates its status, the server
calls `sendShipmentUpdateEmail` in `server/notify.ts`. It checks `RESEND_API_KEY`:

- **If set** → sends a branded HTML email via the Resend API.
- **If unset** → prints the email to the server console (the dev fallback) and records the
  attempt in the `notifications` table.

Every attempt — sent, logged, or errored — is recorded in the `notifications` table and
visible in the shipment drawer under **Status emails**.

## Step 1 — Create a Resend account and an API key

1. Sign up at [resend.com](https://resend.com).
2. Verify a domain (e.g. `tpclogistics.com`) so you can send from `notifications@tpclogistics.com`.
   Resend's *test mode* works for a single verified recipient without a domain — enough for a trial.
3. Create an API key under **API Keys**.

## Step 2 — Configure the server

Edit `server/.env`:

```ini
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM=TPC Logistics <notifications@tpclogistics.com>
SITE_URL=https://track.tpclogistics.com
```

- `RESEND_FROM` must be a sender you're allowed to use (an address on your verified domain,
  or the default `TPC Logistics <onboarding@resend.dev>` in test mode).
- `SITE_URL` is used for the **Track your shipment** button in the email.

## Step 3 — Restart and verify

Restart the server (with `tsx watch` in dev it reloads automatically; in production restart
the process). Then:

1. Open the admin console → Shipments.
2. Create a shipment with a real customer email, or add a customer email to an existing
   shipment and add a status event.
3. Check the customer's inbox for the branded email with a **Track your shipment live** button.
4. Check the shipment drawer → **Status emails** — the new attempt shows provider `resend`,
   status `sent`.

## Step 4 — Remove the dev fallback notice (optional)

If you want the console to stop printing the fallback banner, that's automatic once
`RESEND_API_KEY` is set.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Email shows provider `error` in the drawer | Read the `error` column in the `notifications` table for the reason (see below). |
| "Sender not allowed" / 403 from Resend | `RESEND_FROM` isn't a verified address/domain. Use `onboarding@resend.dev` for testing. |
| Emails going to spam | Authenticate your domain (SPF/DKIM) in Resend's dashboard. |
| Button links to `localhost` | `SITE_URL` is unset or wrong — set it to the public origin. |

### Inspect notification records

```bash
# in server/
node -e "
const Database = require('better-sqlite3');
const db = new Database('data/tpc.db');
console.table(db.prepare('SELECT recipient, provider, status, error, created_at FROM notifications ORDER BY id DESC LIMIT 5').all());
"
```

## Related

- [The tracking pipeline](../explanation/the-tracking-pipeline.md) — where the email fires.
- [Environment variables reference](../reference/environment-variables.md)
- [Database schema reference](../reference/database-schema.md) — the `notifications` table.
