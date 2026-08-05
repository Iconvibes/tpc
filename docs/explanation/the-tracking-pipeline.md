# The tracking pipeline

> **Diátaxis type:** Explanation (understanding)
> **Related reference:** [API reference](../reference/api.md) · [Database schema](../reference/database-schema.md)

## The single source of truth

The whole tracking system is one SQLite file, one set of tables, and one API. The admin
console and the public tracking page are **two clients of the same data**, not two copies.
That is the property that makes "update in the console → instantly visible on the public
site" work with zero syncing code.

```
┌──────────────────┐     ┌──────────────────┐
│  Admin console   │     │ Public tracking  │
│  (React, /admin) │     │  (React, /tracking) │
└────────┬─────────┘     └────────┬─────────┘
         │ POST /api/admin/…       │ GET /api/track/:id
         ▼                        ▼
┌───────────────────────────────────────────┐
│            Express API (app.ts)           │
│  validates → writes → notifies → returns  │
└────────────────────┬──────────────────────┘
                     │ better-sqlite3
                     ▼
┌───────────────────────────────────────────┐
│     SQLite — server/data/tpc.db           │
│  shipments · shipment_events · …          │
└───────────────────────────────────────────┘
```

## The two directions of travel

### Read path (public tracking page)

1. A visitor enters a tracking ID on `/tracking`.
2. The client calls `GET /api/track/:trackingId` (through the Vite proxy in dev).
3. The route looks up the shipment by ID (`findShipment`), upper-cases the input so
   `tpc-2026-1077` works, loads its events, and returns the JSON shape documented in the
   API reference.
4. The tracking page renders the shipment as a waybill-style card with the timeline.

Nothing here needs authentication — tracking is intentionally public.

### Write path (admin console)

1. An admin adds a status event: status, location, optional note, optional ETA.
2. `POST /api/admin/shipments/:id/events` validates the body with a Zod schema
   (`addEventSchema`), then does three things **in one transaction of intent**:
   - inserts a row into `shipment_events`
   - updates the `shipments` row's `status` (and derives `eta` — see the
     [add-a-status how-to](../how-to/add-a-shipment-status.md) for the rules)
   - calls `sendShipmentUpdateEmail` if the customer has an email
3. The public page — refreshing or re-searching — immediately sees the new state, because
   it reads the same tables.

## What the email adds

The notify step (`server/notify.ts`) is deliberately fire-and-forget:

- It renders a branded HTML email from the shipment + event.
- Sends via Resend if `RESEND_API_KEY` is set; otherwise prints to the console.
- **Never throws into the request** — delivery failures are caught, recorded in the
  `notifications` table, and logged. A dead email provider can never break tracking.

The `notifications` row (provider, status, error) is what the admin sees under
**Status emails** in the shipment drawer.

## Deriving the ETA

The shipment's `eta` column is a human string, not a date. When an event is added:

1. `Delivered` → `Delivered <today>` (the delivery date is the point of truth)
2. an explicit `eta` on the event → that string
3. otherwise keep the existing ETA; if there is none, generate `Est. <date>`

This keeps the timeline and the headline ETA consistent without a date-engine.

## Statuses are strings

`status` is free text on both `shipments` and `shipment_events`. The system's vocabulary —
`Registered`, `Picked Up`, `In Transit`, `Customs`, `Out for Delivery`, `Delivered` — lives
in the admin UI's dropdown, not in the database or a validator. Consequences:

- Adding a status is a client change (see [the how-to](../how-to/add-a-shipment-status.md)).
- The API accepts any non-empty status string, so integrations can be lenient.
- `Delivered` is special-cased in two places: the ETA derivation (above) and the public
  page's stamp rendering.

## Why it's built this way

- **One database, two views** — no cache invalidation, no webhooks, no eventual
  consistency: "instant" is a free property of the design.
- **Validated at the edge** — Zod guards every write before it touches the DB, so bad data
  can't corrupt the timeline.
- **Emails detached from the request** — the customer-facing promise (tracking is always
  up-to-date) never depends on a third-party email provider being healthy.

## Related

- [The "Port Ledger" design system](the-port-ledger-design-system.md) — how the tracking
  result is presented.
- [API reference](../reference/api.md) — exact shapes for both directions.
