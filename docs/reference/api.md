# API reference

> **Diátaxis type:** Reference (information)
> **Base URL:** `http://localhost:5000` (dev) — the client proxies `/api/*` through Vite,
> so `http://localhost:5173/api/*` works too.

All endpoints return JSON. Errors share one shape:

```json
{ "error": "Human-readable message" }
```

Validation failures additionally include a `fields` map:

```json
{
  "error": "Validation failed.",
  "fields": { "name": "This field cannot be empty.", "email": "That email address looks invalid." }
}
```

Unexpected server errors return a generic `Internal server error.` when `NODE_ENV` is
`production`; in development the raw message is included.

## Conventions

- Tracking IDs are case-insensitive and normalized to uppercase (`tpc-2026-1042` → `TPC-2026-1042`).
- Shipment IDs in URLs are numeric.
- Admin routes require a session cookie set by `POST /api/auth/sign-in/email`; otherwise they
  return `401`.
- A logged-in non-admin gets `403` (only the `admin` role may use these routes).
- Public write routes (`/api/contact`, `/api/quote`) are rate-limited to 60 requests per
  15 minutes per IP by default (429 when exceeded).
- `POST /api/auth/sign-in/email` is rate-limited to 10 attempts per 15 minutes per IP, on
  top of Better Auth's own per-IP throttle on sign-in (3 per 10 s).

---

## Health

### `GET /api/health`

Liveness probe — no auth.

```json
{ "ok": true, "service": "TPC Logistics API", "time": "2026-08-05T10:41:11.079Z" }
```

## Tracking (public)

### `GET /api/track/:trackingId`

Shipment details + full event timeline.

| Status | When |
| --- | --- |
| `200` | Found |
| `404` | No shipment with that ID |

```json
{
  "id": 2,
  "trackingId": "TPC-2026-1077",
  "customer": "Greenfield Agro Exports",
  "customerEmail": "ops@greenfieldagro.example.com",
  "cargo": "Dried produce (3 pallets)",
  "origin": "Ibadan, Nigeria",
  "destination": "London, United Kingdom",
  "weight": "1,150 kg",
  "mode": "Air",
  "status": "In Transit",
  "eta": "Est. Aug 8, 2026",
  "events": [
    { "status": "Registered", "location": "Ibadan, Nigeria", "note": "Shipment registered…", "happened_at": "Aug 3, 2026 · 08:45" }
  ]
}
```

`mode` is one of `Air | Sea | Road`. `events` is ordered oldest → newest.

## Public forms

### `POST /api/contact`

Saves a contact message. **Rate-limited.**

Body (`name` and `message` required; `email` required and valid):

```json
{ "name": "Amina", "email": "amina@example.com", "phone": "+234…", "subject": "Rates", "message": "Hi!" }
```

| Status | Response |
| --- | --- |
| `201` | `{ "ok": true, "message": "Message received — our team will reply within one business day." }` |
| `400` | Validation error with `fields` |

### `POST /api/quote`

Saves a quote request. **Rate-limited.** All fields optional except `name` and `email`:

```json
{ "name": "Amina", "company": "ACME", "email": "amina@example.com", "phone": "+234…", "service": "Air", "origin": "Lagos", "destination": "London", "weight": "500 kg", "note": "Urgent" }
```

| Status | Response |
| --- | --- |
| `201` | `{ "ok": true, "message": "Quote request received — expect a tailored quote within 24 hours." }` |
| `400` | Validation error with `fields` |

## Authentication (Better Auth)

Mounted at `/api/auth/*`. Standard Better Auth endpoints, including:

### `POST /api/auth/sign-in/email`

**Rate-limited** (10 attempts / 15 min / IP, plus Better Auth's built-in 3 per 10 s).

```json
{ "email": "admin@tpclogistics.com", "password": "your-password" }
```

| Status | Response |
| --- | --- |
| `200` | Session token + user; sets the `better-auth.session_token` cookie |
| `401` | Bad credentials (Better Auth's own error body) |
| `429` | Too many attempts (express-rate-limit) |

Requires a matching `Origin` header in the browser (CSRF protection; the dev client sends it
via the Vite proxy automatically).

### `POST /api/auth/sign-out` · `GET /api/auth/get-session` · `POST /api/auth/change-password`

Standard Better Auth session/account endpoints, documented by
[Better Auth](https://better-auth.com/docs). `change-password` requires the current password
in the body and also needs the CSRF `Origin` header.

### `GET /api/auth/ok`

Returns `{ ok: true }` if Better Auth is reachable (used by the client to check server health).

## Admin console

All of the following require a valid admin session cookie.

### Inbox — messages

| Method & route | Description |
| --- | --- |
| `GET /api/admin/messages` | List all messages, newest handled-first |
| `POST /api/admin/messages/:id/toggle` | Flip `handled` (and set/clear `handled_at`) |
| `DELETE /api/admin/messages/:id` | Delete a message |

Message shape (list):

```json
{ "id": 3, "name": "Amina", "email": "amina@example.com", "phone": null, "subject": "Rates", "message": "Hi!", "handled": 0, "handled_at": null, "created_at": "2026-08-05 10:41:11" }
```

| Status | When |
| --- | --- |
| `200` | OK |
| `404` | `{ "error": "Message not found." }` |
| `400` | Non-numeric id |

### Inbox — quotes

| Method & route | Description |
| --- | --- |
| `GET /api/admin/quotes` | List all quote requests |
| `POST /api/admin/quotes/:id/toggle` | Flip `handled` |
| `DELETE /api/admin/quotes/:id` | Delete a quote |

Quote shape (list) adds `company`, `service`, `origin`, `destination`, `weight`, `note` to
the message shape above.

### Shipments

| Method & route | Description |
| --- | --- |
| `GET /api/admin/shipments` | List all shipments, newest first, plus `eventCount` per row |
| `POST /api/admin/shipments` | Create a shipment; generates the tracking ID |
| `GET /api/admin/shipments/:id` | Shipment detail + events (same shape as public tracking) |
| `PATCH /api/admin/shipments/:id` | Update one or more fields |
| `POST /api/admin/shipments/:id/events` | Add a status event (updates `status` + `eta`, fires email) |
| `DELETE /api/admin/shipments/:id` | Delete shipment + its events + notifications |

#### `POST /api/admin/shipments` — create

Body — `mode` must be `Air`, `Sea`, or `Road`:

```json
{ "customer": "Amina", "customer_email": "amina@example.com", "cargo": "1 pallet", "origin": "Lagos, Nigeria", "destination": "Accra, Ghana", "weight": "25 kg", "mode": "Road" }
```

`customer_email` is optional. On success (`201`), returns the shipment as `GET …/:id` does,
with `status` set to `Registered` and a first "Registered" event. The tracking ID is
generated as `TPC-<year>-<next-number>` (e.g. `TPC-2026-1091`).

#### `PATCH /api/admin/shipments/:id` — update

Any subset of the create fields plus `eta`. At least one field is required. Empty-string
`eta` / `customer_email` clears the value; other fields reject empty strings (`400`).

```json
{ "weight": "60 kg", "eta": "Est. Aug 12, 2026" }
```

#### `POST /api/admin/shipments/:id/events` — add status event

Body:

```json
{ "status": "In Transit", "location": "Ore, Ondo", "note": "Truck departed Lagos", "eta": "Est. Aug 8, 2026" }
```

- `status` and `location` required; `note`/`eta` optional.
- Inserts an event row, sets the shipment's `status`, and derives `eta`:
  - `Delivered` → `Delivered <today>`
  - explicit `eta` on the event → that value
  - otherwise keep the existing `eta`, or generate `Est. <date>` if none
- Sends a status-update email if `customer_email` is set (see
  [Enable email notifications](../how-to/enable-email-notifications.md)).
- Returns the updated shipment (`200`).

#### `GET /api/admin/shipments/:id/notifications`

Last 50 email attempts for the shipment:

```json
{ "id": 5, "recipient": "amina@example.com", "subject": "TPC-2026-1091 — In Transit: Ore, Ondo", "provider": "console", "status": "logged", "error": null, "created_at": "2026-08-05 10:41:11" }
```

`provider` is `resend` or `console`; `status` is `sent`, `logged`, or `error` (with the
reason in `error`).

---

## Route summary

| Method | Route | Auth | Rate-limited |
| --- | --- | --- | --- |
| GET | `/api/health` | – | – |
| GET | `/api/track/:trackingId` | – | – |
| POST | `/api/contact` | – | ✅ |
| POST | `/api/quote` | – | ✅ |
| POST | `/api/auth/sign-in/email` | – | ✅ (10 per 15 min + Better Auth built-in) |
| POST | `/api/auth/sign-out` | session | – |
| GET | `/api/auth/get-session` | – | – |
| POST | `/api/auth/change-password` | session | – |
| GET | `/api/auth/ok` | – | – |
| GET | `/api/admin/messages` | admin | – |
| POST | `/api/admin/messages/:id/toggle` | admin | – |
| DELETE | `/api/admin/messages/:id` | admin | – |
| GET | `/api/admin/quotes` | admin | – |
| POST | `/api/admin/quotes/:id/toggle` | admin | – |
| DELETE | `/api/admin/quotes/:id` | admin | – |
| GET | `/api/admin/shipments` | admin | – |
| POST | `/api/admin/shipments` | admin | – |
| GET | `/api/admin/shipments/:id` | admin | – |
| PATCH | `/api/admin/shipments/:id` | admin | – |
| POST | `/api/admin/shipments/:id/events` | admin | – |
| DELETE | `/api/admin/shipments/:id` | admin | – |
| GET | `/api/admin/shipments/:id/notifications` | admin | – |
