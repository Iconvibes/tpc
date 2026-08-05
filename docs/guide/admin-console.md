# Admin Console Guide for TPC Staff

This guide explains how to use TPC's operations console — the private part of the website
where you handle customer messages and look after shipments. It is written for everyday
users: no technical knowledge is needed. If a screen looks slightly different from what's
described here, the buttons and labels below will still point you in the right place.

The console lives at **`/admin`** on the website address (for example
`https://your-site.com/admin`). It is separate from the public website, which customers see.

---

## Signing in

1. Go to `/admin` on your website address.
2. Enter the **email** and **password** your manager gave you, then click **Sign In**.
3. You'll land on the **Overview** page. Use the **Logout** button at the top right when
   you're finished — always log out when you leave a shared computer.

If you see a box showing demo credentials on the sign-in screen, that means the console is
still using the default password and **someone should change it** (see
[Changing your password](#changing-your-password) below). Never leave the console on the
default password.

> Forgot your password? Ask whoever set up the console to reset it — you can't reset it
> yourself from this screen.

---

## The four tabs

Across the top of the console you'll find four tabs:

| Tab | What it's for |
| --- | ------------- |
| **Overview** | A snapshot: unread messages, new quote requests, active shipments, and recent activity. |
| **Inbox** | Messages and quote requests sent from the website. |
| **Shipments** | Every shipment on the books — create them, update their status, keep customers informed. |
| **Settings** | Change your password. |

A red number on the **Inbox** tab shows how many items are waiting for you.

---

## Overview

The Overview page shows four numbers at a glance:

- **Unread messages** — contact messages you haven't handled yet.
- **New quote requests** — price requests you haven't replied to yet.
- **Active shipments** — everything that isn't delivered yet.
- **Total shipments** — everything on the books.

Below those, **Latest messages** and **Recent shipments** give you a quick look at what's
happening. Use the **New Shipment** button to jump straight into creating one.

---

## Inbox

The Inbox is where website visitors reach you. It has two tabs of its own:

- **Messages** — general contact messages ("I need to ship something", questions, etc.).
- **Quotes** — requests for a price quote, with route and cargo details.

Each tab shows how many new items are waiting, for example "Messages (3 new)".

### Reading an item

Click the arrow on the right of any item to open it:

- A **message** shows the subject (if the customer gave one) and the full message.
- A **quote** shows the details that matter for pricing: service, route (origin →
  destination), weight, and company — plus any extra details the customer wrote.

Every item shows the sender's name, contact details, and when it arrived. Items you haven't
handled yet carry a **New** badge.

### Replying

Once an item is open, use **Reply by email** to open your email program with the reply
already addressed to the customer. If a phone number is listed, **Call** dials it for you.

### Marking items handled

Tick the **checkmark** button on an item when you've dealt with it. It moves to the handled
state (the item dims) so you can see at a glance what's still outstanding. Ticking it again
marks it new — useful if you marked something by mistake or a customer writes back.

### Deleting

Use the **trash** button to remove an item. You'll be asked to confirm, and **deletion is
permanent** — once it's gone, it's gone. It's better to mark items handled than to delete
them, in case you need to look them up later.

---

## Shipments

The Shipments page is the heart of the console — it's where every shipment is created and
where its story is kept up to date.

### Searching

Use the search box at the top to find a shipment by **tracking ID, customer, cargo, or
route**. Type a few letters and the list narrows as you go.

### The shipment list

Each row shows the tracking ID, customer, cargo, route, mode of transport, current status,
and ETA. **Click any row to open the full shipment** in a panel on the right.

### Creating a shipment

1. Click **New Shipment**.
2. Fill in the form:
   - **Customer \*** — who the shipment belongs to.
   - **Customer email** — optional, but important: this is where status alerts go. See
     [Keeping customers informed](#keeping-customers-informed) below.
   - **Cargo \*** — what's being shipped (e.g. "Electronics (4 pallets)").
   - **Origin \*** and **Destination \*** — the route.
   - **Weight \*** — the shipment's weight.
   - **Mode** — how it travels: **Air**, **Sea**, or **Road**.
3. Click **Create Shipment**.

The console automatically gives the shipment a **tracking ID** (e.g. `TPC-2026-1092`).
This is the number your customer uses on the public tracking page. Share it with them as
soon as the shipment exists.

### Updating a shipment's status

This is the most important habit in the console: **keep statuses current**. Every time you
update a status, it appears instantly on the public tracking page for the customer.

Open the shipment, then under **Update status**:

1. **Status** — choose where the shipment is in its journey. The available steps are:
   **Registered**, **Picked Up**, **In Transit**, **Customs**, **Out for Delivery**,
   **Delivered**.
2. **Location \*** — the place the shipment is at (e.g. "Apapa Port, Lagos"). This is
   required.
3. **Note** — optional detail worth sharing (e.g. "Container loaded aboard MV X").
4. **ETA** — optional expected arrival date (e.g. "Est. Aug 12, 2026").
5. Click **Update**.

The **Timeline** section below shows the shipment's whole story, newest first, so you can
see every step at a glance. The most recent event is highlighted.

### Keeping customers informed

If a customer email is set on the shipment, creating the shipment and every status update
after that automatically send the customer a **tracking-update email** with a link to the
tracking page. That's why the customer email matters — without it, the customer gets
nothing.

The **Status emails** section lists every email we've tried to send for that shipment, to
whom, and whether it went through. A red dot means the email failed to send — check the
customer's email address and update it if needed.

### Editing a shipment's details

Open the shipment, go to **Shipment details**, and click **Edit**. Change what you need
and click **Save** (or **Cancel** to discard). You can correct the customer name, email,
cargo, route, weight, mode, and ETA.

### Deleting a shipment

The **Delete shipment** button at the bottom removes the shipment permanently — it can't
be undone, and the customer will no longer be able to track it. Only delete shipments you
are certain should not exist (for example a duplicate created by mistake).

---

## Changing your password

1. Open the **Settings** tab.
2. Enter your **current password**, then the **new password**, then **confirm** it.
3. Click **Update Password**.

Rules: the new password must be at least 8 characters, and both copies must match. You'll
see a confirmation when it succeeds. Your current sessions stay active, so you don't need
to sign in again.

---

## Good habits, in short

- **Update statuses as things happen** — customers watch the tracking page; an up-to-date
  status is the best customer service you can give.
- **Add the customer email** when creating a shipment so alerts go out automatically.
- **Mark inbox items handled** as you reply, so nothing falls through the cracks.
- **Log out** when you step away, and change the password away from any default.
- **Deleting is permanent** — think twice before deleting a shipment or a message.
