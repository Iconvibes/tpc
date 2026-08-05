# The "Port Ledger" design system

> **Diátaxis type:** Explanation (understanding)
> **Related code:** `client/src/styles.css` (design tokens) · `client/src/components/WaybillCard.jsx`

## The idea in one sentence

The site is styled as a **living cargo manifest** — the documents that are TPC Logistics'
actual world — instead of a generic logistics-SaaS template. Shipping data is rendered as
data: monospaced, ruled, stamped.

The design direction was chosen deliberately against three common AI/template looks:
no dark-navy + orange-gradient hero, no cream + serif + terracotta, no broadsheet hairline
columns. The subject — freight forwarders in Ikeja, Lagos, who move air waybills, port
codes, and customs stamps — supplied the vocabulary.

## Design tokens

Defined as CSS custom properties in `:root` (`client/src/styles.css`). The core palette:

| Token | Value | Role |
| --- | --- | --- |
| `--harbor` | `#0b1d1c` | night-harbor ink — dark ground (teal-leaning, not navy, not black) |
| `--paper` | `#f4efe5` | document paper — light ground |
| `--card` | `#fbf8f1` | sheet surface (raised paper) |
| `--ink` | `#20302e` | primary text on paper |
| `--body` | `#465b57` | secondary text |
| `--muted` | `#61736b` | tertiary text (AA-compliant on paper) |
| `--amber` | `#f0a02e` | stamp amber — the brand orange, **flat, no gradients** |
| `--rust` | `#c25b22` | customs / warning |
| `--clear` | `#2e8b5f` | cleared / delivered green |
| `--line` | `#dcd2bc` | hairline rules on paper |

Two structural decisions worth noting:

- **`--gradient-brand` is a single flat color.** The redesign removed every gradient; the
  brand color behaves like an ink stamp, not a glow.
- **All surfaces are paper-tinted.** No pure-white or pure-black cards; even the dark
  sections sit on `harbor`, which leans teal to stay warm next to the amber.

## Typography — three roles, three families

| Family | Role |
| --- | --- |
| **Big Shoulders Display** | condensed industrial display face — headings, section titles |
| **Archivo** | body text and UI copy |
| **IBM Plex Mono** | *all data* — tracking IDs, port codes, weights, labels, stamps, section indexes |

The mono family is the system's signature voice: anything that is a *number or identifier*
renders in monospace, so data visibly reads as data. Section eyebrows are typed like ledger
indexes — `SVC-01 · WHAT WE DO`, `OPS-02 · HOW IT WORKS` — rather than decorative icons.

## Layout language

- **Ledger labels:** every section carries a mono eyebrow (a true catalog index, since the
  page genuinely is a catalog of services/process).
- **Document surfaces:** cards are paper sheets with thin sharp rules — no pill buttons,
  no drop-shadow glows, no glassmorphism. Buttons are squared "tickets".
- **Port-code marquee:** a scrolling ticker of real IATA port codes (LOS, LHR, SHA, …) —
  movement that encodes the freight world rather than decorative animation.
- **Waypoint-numbered steps:** the process section numbers steps because the process *is* a
  sequence (the index carries information the reader needs).

## The signature: the Live Waybill

The one memorable element. On the home hero, a **document-styled air waybill card**
(`WaybillCard.jsx`) that:

1. **Fetches a real shipment** from the public tracking API on mount
   (`GET /api/track/:trackingId`, defaulting to the seeded `TPC-2026-1077`).
2. Renders it as a waybill: IATA port codes (IBA → LHR), consignee, cargo, weight, mode,
   and a **status stamp** that reflects the shipment's actual current status.
3. Falls back to a static seeded waybill if the API is unreachable (so the hero never
   breaks), and offers a **Track this shipment** deep-link into the tracking page.

The site's own operational data *is* the hero — the same table an admin updates in the
console renders live in the marketing page. The decorative globe and floating chips that
preceded it were removed.

## Implementation notes for contributors

- **Tokens, not literals:** use the `--*` custom properties for colors, spacing, radii, and
  shadows. Do not introduce new hex values ad hoc.
- **No gradients, no pills:** both are banned by the token layer (`--gradient-brand` is a
  flat color) and by the component conventions.
- **Mono for data:** tracking IDs, port codes, weights, timestamps, and eyebrow indexes use
  `--font-mono`. If you're styling a number or identifier, reach for mono.
- **Accessibility:** the palette is chosen for AA contrast (the `--muted` token was darkened
  for exactly this), and the CSS includes `:focus-visible` styles and
  `prefers-reduced-motion` support — respect both when adding animation.
- **The admin console** inherits the same tokens and ledger language, so a status update in
  the console and a waybill on the marketing site feel like the same system.

## Related

- [The tracking pipeline](the-tracking-pipeline.md) — the data behind the Live Waybill.
- `client/src/styles.css` — the single source of truth for tokens.
