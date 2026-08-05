# TPC Logistics — Documentation

This is the documentation suite for the TPC Logistics full-stack website: a React + Vite
frontend, an Express + TypeScript API, SQLite storage, and Better Auth for admin
authentication.

The suite follows the **Diátaxis** framework, which separates documentation by the reader's
goal. There are four kinds of document here, and they answer four different questions:

| Quadrant        | The question it answers | You want this when…                                        |
| --------------- | ----------------------- | ---------------------------------------------------------- |
| **Tutorials**   | *Learning* — what does this do? | You want to see the whole thing work, step by step.  |
| **How-to**      | *Task* — how do I do a specific thing? | You have a concrete job to get done (deploy, reset a password…). |
| **Reference**   | *Information* — what are the exact facts? | You need precise details: an endpoint, a variable, a table. |
| **Explanation** | *Understanding* — how does this fit together? | You want to reason about the system, not just use it. |

---

## Start here, depending on your goal

- **I've never used the project before** → [Tutorial: your first shipment](tutorials/your-first-shipment.md)
- **I need to deploy it or reset something** → [How-to guides](how-to/)
- **I need the exact API, env var, or schema facts** → [Reference](reference/)
- **I want to understand how auth, tracking, or the design works** → [Explanation](explanation/)
- **I work at TPC and use the admin console** → [Admin console guide for staff](guide/admin-console.md)

## Documentation index

### Tutorials

- [Your first shipment](tutorials/your-first-shipment.md) — a guided lesson that takes you
  from a fresh checkout to a shipment you created yourself, tracked live, with a status
  email fired at the end.

### How-to guides

- [Deploy to production](how-to/deploy-to-production.md) — build, configure, and run the
  site on a server.
- [Enable email notifications](how-to/enable-email-notifications.md) — send real tracking
  emails with Resend instead of the console fallback.
- [Reset the admin password](how-to/reset-admin-password.md) — the three ways to get back
  into the admin console.
- [Add a shipment status](how-to/add-a-shipment-status.md) — extend the statuses the admin
  can set, end to end.

### Reference

- [API reference](reference/api.md) — every route, method, parameter, request body, and
  response shape.
- [Environment variables](reference/environment-variables.md) — every variable, its default,
  and when to set it.
- [Database schema](reference/database-schema.md) — every table, column, and relationship.

### Explanation

- [How authentication works](explanation/how-authentication-works.md) — Better Auth, sessions,
  cookies, roles, and the demo-password probe.
- [The tracking pipeline](explanation/the-tracking-pipeline.md) — how a status update flows
  from the admin console to the public tracking page and an email inbox.
- [The "Port Ledger" design system](explanation/the-port-ledger-design-system.md) — the
  design language and the Live Waybill.

## For TPC staff

- [Admin console guide](guide/admin-console.md) — a plain-language, non-technical guide to
  the `/admin` console: inbox, quotes, shipments, and settings. It sits outside the four
  quadrants because it's a user manual rather than developer documentation.

## How to read the docs

The quadrants are deliberately kept separate: the how-to guides assume you can already run
the project, the reference assumes you know what you're looking for, and the explanations
refer to concepts defined in the reference. If you're new, start with the tutorial and read
the explanations *after* you've seen the system work — they will make more sense that way.

## Conventions used throughout

- Commands run from the repository root unless a block says otherwise (e.g. `# in server/`).
- The API runs on port `5000` by default; the client dev server on `5173`.
- The default admin account is `admin@tpclogistics.com` / `tpc-admin-2026` on a fresh install —
  change it after signing in.
- Demo tracking IDs you can try: `TPC-2026-1042`, `TPC-2026-1077`, `TPC-2026-1081`,
  `TPC-2026-1055`, `TPC-2026-1086`, `TPC-2026-1090`.
