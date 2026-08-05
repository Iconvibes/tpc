# How to: Add a shipment status

> **Diátaxis type:** How-to (task)
> **Goal:** add a new status (e.g. `On Hold`) that admins can set, and that the public
> tracking page and emails render correctly.

## How statuses work (the short version)

A status is just a string stored on the `shipments` row and on each `shipment_events` row.
The database does **not** constrain the values — the system currently uses:

`Registered` · `Picked Up` · `In Transit` · `Customs` · `Out for Delivery` · `Delivered`

The admin UI offers these from a list (`STATUS_OPTIONS` in
`client/src/admin/AdminShipments.jsx`). The API accepts any non-empty string. Because
statuses are free-form, adding one is mostly a client change plus a few places that switch
on status names.

## Step 1 — Add it to the admin dropdown

In `client/src/admin/AdminShipments.jsx`:

```js
const STATUS_OPTIONS = ['Registered', 'Picked Up', 'In Transit', 'Customs', 'Out for Delivery', 'Delivered'];
```

Add your status to this array:

```js
const STATUS_OPTIONS = ['Registered', 'Picked Up', 'In Transit', 'Customs', 'Out for Delivery', 'Delivered', 'On Hold'];
```

## Step 2 — Check the email emoji mapping

`server/notify.ts` maps status → emoji for the email subject:

```ts
function statusEmoji(status: string): string {
  switch (status) {
    case 'Delivered': return '✅';
    case 'Out for Delivery': return '🚚';
    case 'Customs': return '🛃';
    case 'In Transit': return '✈️';
    case 'Picked Up': return '📦';
    default: return '📝';
  }
}
```

Unlisted statuses already fall back to `📝`, so this is **optional** — add a case only if you
want a distinct emoji.

## Step 3 — Check the public tracking page

`client/src/pages/Tracking.jsx` treats `Delivered` specially (it changes the result-card
presentation, e.g. the stamp color). Any other status renders generically with the status
stamp text, so a new status needs no code change — verify visually after you add it.

## Step 4 — ETA behavior (important)

The API derives the shipment's ETA text when an event is added (`server/app.ts`):

1. `Delivered` → `Delivered <date>` (the current date)
2. an explicit `eta` on the event → that value
3. otherwise the existing ETA is kept, or a new `Est. <date>` is generated if there was none

A custom status that should *always* show a specific ETA should be passed as the event's
`eta` field rather than hardcoded — or add a branch in this function if the rule is
structural (e.g. "On Hold" clears the ETA).

## Step 5 — Rebuild and test

```bash
npm run dev        # dev servers hot-reload automatically
```

1. Sign in at `/admin` → Shipments.
2. Add an event with your new status.
3. Open the public tracking page for that shipment — the timeline shows the new status.
4. If a customer email is set, the email subject uses your emoji.

## Related

- [The tracking pipeline](../explanation/the-tracking-pipeline.md) — the full flow behind
  Step 2–4.
- [API reference](../reference/api.md) — the `POST /api/admin/shipments/:id/events` contract.
