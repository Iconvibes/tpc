# Tutorial: Your first shipment

> **Diátaxis type:** Tutorial (learning)
> **Audience:** a developer who has never run the project before
> **Goal:** by the end, you will have created a shipment in the admin console, watched it
> appear on the public tracking page, and triggered a status email — the whole loop.

This is a **lesson**, not a reference. Follow it top to bottom; do not skip ahead. It takes
about ten minutes.

## What you will build

TPC Logistics is a freight-forwarding website. This tutorial walks you through the single
most important workflow in the system: a shipment moving from the admin console, to the
public tracking page, to a customer's email inbox.

Along the way you will touch every major piece of the stack:

- the React client (`client/`)
- the Express API (`server/app.ts`)
- the SQLite database (`server/data/tpc.db`)
- the auth layer (Better Auth) protecting the admin console
- the email notifications system

## Prerequisites

- Node.js 20+ (the project uses modern `fetch`, workspaces, and `tsx`)
- npm (bundled with Node)
- A terminal and a browser

You do not need any database or external accounts — SQLite is embedded, and emails fall back
to the server console when no email provider is configured.

## Step 1 — Get the code and install dependencies

From the repository root:

```bash
npm install
```

This installs all workspaces (`client` and `server`) into a hoisted `node_modules` at the
repo root. It may take a minute.

## Step 2 — Create your environment file

The server reads configuration from `server/.env`. There is a template:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set a `BETTER_AUTH_SECRET` — the auth layer refuses to run without
one in production. Generate a random value:

```bash
openssl rand -base64 32
```

Paste the output into the file. For this tutorial the other values can stay at their
defaults.

## Step 3 — Run both servers

```bash
npm run dev
```

This starts the API on **port 5000** and the Vite dev server on **port 5173** (the client
proxies `/api/*` to the API). You should see:

- `TPC Logistics API listening` (port 5000)
- Vite's dev server banner (port 5173)

Open **http://localhost:5173** in your browser. You should see the TPC Logistics home page
with a "Live Waybill" card on the hero showing a real seeded shipment (for example
`TPC-2026-1077`, Ibadan → London).

> **What just happened?** On first boot, the server created the SQLite database at
> `server/data/tpc.db`, created all tables (including the Better Auth auth tables), seeded
> six demo shipments, and created the default admin user.

## Step 4 — Sign in to the admin console

Visit **http://localhost:5173/admin**. You'll see a login screen.

- **Email:** `admin@tpclogistics.com`
- **Password:** `tpc-admin-2026`

The login screen shows a hint saying these are the demo credentials — that hint disappears
automatically once you change the password (we won't do that in this tutorial; see the
[how-to guide](../how-to/reset-admin-password.md) if you want to).

Sign in. You land on the dashboard with live statistics and recent shipments.

## Step 5 — Create a shipment

1. Open the **Shipments** tab.
2. Click **New shipment**.
3. Fill in the form. Use your own name and a real-looking route, for example:
   - Customer: `Your Name`
   - Cargo: `Sample cargo (1 box)`
   - Origin: `Lagos, Nigeria`
   - Destination: `Accra, Ghana`
   - Weight: `25 kg`
   - Mode: `Road`
   - Customer email: leave it blank for now (we'll add it in Step 7)
4. Save.

The new shipment appears at the top of the list with a **generated tracking ID** like
`TPC-2026-1091` (the year followed by a sequential number). Its status is `Registered`.

## Step 6 — See it on the public tracking page

Open **http://localhost:5173/tracking** (or just open a new tab). Type your tracking ID —
`TPC-2026-1091`, or whatever was generated — and search.

You'll see your shipment rendered as a **waybill-style card**: route, cargo, weight, mode,
and a timeline with one event so far: *Registered — Shipment registered via TPC ops portal*.

**This is the same data** the admin console shows — there is exactly one database, and the
public page reads from it over the API (`GET /api/track/:trackingId`).

## Step 7 — Update the status and see the email

Back in the admin console, in the shipments list, open your shipment and:

1. Click **Add event** (or the status update action).
2. Choose status `In Transit`, location `Ore, Ondo` (a real road-route town in Nigeria), and
   a note like `Truck departed Lagos`.
3. Save.

Now check the server console — you'll see a log line like:

```
DEV MAIL (console fallback) — set RESEND_API_KEY to send real emails
```

Because no email provider is configured, the notification is **printed to the server
console** instead of sent. (If you'd set a customer email on the shipment, the message
would be addressed to them; every attempt is recorded in the `notifications` table
regardless.)

Now refresh the public tracking page for your ID: the timeline shows the new `In Transit`
event, and the status stamp updates. Two things just happened:

1. The **public tracking page** reflects the new status instantly (no cache, no polling
   hacks — it fetches live).
2. A **notification** was recorded in the database.

## Step 8 — What you learned

- The project is two processes (API + client) talking over a proxy.
- SQLite is the single source of truth; the public page and the admin console both read it.
- Tracking IDs are auto-generated: `TPC-<year>-<number>`.
- The admin console is protected by Better Auth sessions; the public pages are open.
- Status updates are one-directional: an event row is inserted, the shipment's status field
  is updated, and a notification is fired.

## Next steps

- Read [How authentication works](../explanation/how-authentication-works.md) to understand
  the login screen you just used.
- Read [The tracking pipeline](../explanation/the-tracking-pipeline.md) for the full flow
  behind Step 7.
- When you're ready to run this for real: [Deploy to production](../how-to/deploy-to-production.md).
- To send real emails: [Enable email notifications](../how-to/enable-email-notifications.md).
