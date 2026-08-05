import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');
// DB_PATH overrides the default location (used by the test suite for isolation).
const dbPath = process.env.DB_PATH || join(dataDir, 'tpc.db');
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* --------------------------------- schema -------------------------------- */

db.exec(`
  CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_id TEXT UNIQUE NOT NULL,
    customer TEXT NOT NULL,
    customer_email TEXT,
    cargo TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    weight TEXT NOT NULL,
    mode TEXT NOT NULL,
    status TEXT NOT NULL,
    eta TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shipment_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL REFERENCES shipments(id),
    status TEXT NOT NULL,
    location TEXT NOT NULL,
    note TEXT,
    happened_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    handled INTEGER NOT NULL DEFAULT 0,
    handled_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    service TEXT,
    origin TEXT,
    destination TEXT,
    weight TEXT,
    note TEXT,
    handled INTEGER NOT NULL DEFAULT 0,
    handled_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL REFERENCES shipments(id),
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  /* --------- Better Auth tables (kept in sync with the better-auth CLI) ---------
     Creating them here makes a fresh DB fully self-contained — no CLI step needed. */
  CREATE TABLE IF NOT EXISTS "user" (
    "id" text not null primary key,
    "name" text not null,
    "email" text not null unique,
    "emailVerified" integer not null,
    "image" text,
    "createdAt" date not null,
    "updatedAt" date not null,
    "role" text,
    "banned" integer,
    "banReason" text,
    "banExpires" date
  );
  CREATE TABLE IF NOT EXISTS "session" (
    "id" text not null primary key,
    "expiresAt" date not null,
    "token" text not null unique,
    "createdAt" date not null,
    "updatedAt" date not null,
    "ipAddress" text,
    "userAgent" text,
    "userId" text not null references "user" ("id") on delete cascade,
    "impersonatedBy" text
  );
  CREATE TABLE IF NOT EXISTS "account" (
    "id" text not null primary key,
    "accountId" text not null,
    "providerId" text not null,
    "userId" text not null references "user" ("id") on delete cascade,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" date,
    "refreshTokenExpiresAt" date,
    "scope" text,
    "password" text,
    "createdAt" date not null,
    "updatedAt" date not null
  );
  CREATE TABLE IF NOT EXISTS "verification" (
    "id" text not null primary key,
    "identifier" text not null,
    "value" text not null,
    "expiresAt" date not null,
    "createdAt" date not null,
    "updatedAt" date not null
  );
`);

/* --------------------- migrations (pre-Better-Auth dbs) ------------------- */

const tableCols = (table: string): string[] =>
  (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);

const ensureColumn = (table: string, column: string, ddl: string) => {
  if (!tableCols(table).includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
};

ensureColumn('shipments', 'customer_email', 'customer_email TEXT');
ensureColumn('messages', 'handled', 'handled INTEGER NOT NULL DEFAULT 0');
ensureColumn('messages', 'handled_at', 'handled_at TEXT');
ensureColumn('quotes', 'handled', 'handled INTEGER NOT NULL DEFAULT 0');
ensureColumn('quotes', 'handled_at', 'handled_at TEXT');

// Rebuild shipments without the legacy created_by column (it referenced the
// old admin_users table that Better Auth replaces). We use legacy_alter_table
// so RENAME does NOT rewrite child foreign keys: child tables keep pointing at
// the name 'shipments', which the new table takes over after the old one drops.
if (tableCols('shipments').includes('created_by')) {
  db.pragma('foreign_keys = OFF');
  db.pragma('legacy_alter_table = ON');
  try {
    db.exec(`
      CREATE TABLE shipments_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracking_id TEXT UNIQUE NOT NULL,
        customer TEXT NOT NULL,
        customer_email TEXT,
        cargo TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        weight TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        eta TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      INSERT INTO shipments_new (id, tracking_id, customer, customer_email, cargo, origin, destination, weight, mode, status, eta, created_at)
        SELECT id, tracking_id, customer, customer_email, cargo, origin, destination, weight, mode, status, eta, created_at FROM shipments;
      DROP TABLE shipments;
      ALTER TABLE shipments_new RENAME TO shipments;
    `);
  } finally {
    db.pragma('legacy_alter_table = OFF');
    db.pragma('foreign_keys = ON');
  }
  console.log('🗄️  Migrated shipments table (dropped legacy created_by column)');
}

// Repair pass: an earlier (buggy) attempt renamed shipments to shipments_legacy
// and dropped it, leaving child tables with a dangling FK to a missing table.
// Rebuild any child table whose FK target does not exist so they point at
// shipments again. Safe to run on every boot (no-op when FKs are already clean).
function repairDanglingFks() {
  const existing = new Set(
    (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map((r) => r.name)
  );
  const rebuild = (table: string, ddl: string, columns: string) => {
    const fks = db.prepare(`PRAGMA foreign_key_list(${table})`).all() as { table: string }[];
    if (fks.length === 0 || fks.every((f) => existing.has(f.table))) return false;
    db.pragma('foreign_keys = OFF');
    try {
      db.exec(`
        ALTER TABLE ${table} RENAME TO ${table}_repair;
        CREATE TABLE ${table} (${ddl});
        INSERT INTO ${table} (${columns}) SELECT ${columns} FROM ${table}_repair;
        DROP TABLE ${table}_repair;
      `);
    } finally {
      db.pragma('foreign_keys = ON');
    }
    console.log(`🗄️  Repaired dangling FK on ${table}`);
    return true;
  };

  rebuild(
    'shipment_events',
    `id INTEGER PRIMARY KEY AUTOINCREMENT,
     shipment_id INTEGER NOT NULL REFERENCES shipments(id),
     status TEXT NOT NULL,
     location TEXT NOT NULL,
     note TEXT,
     happened_at TEXT NOT NULL`,
    'id, shipment_id, status, location, note, happened_at'
  );
  rebuild(
    'notifications',
    `id INTEGER PRIMARY KEY AUTOINCREMENT,
     shipment_id INTEGER NOT NULL REFERENCES shipments(id),
     recipient TEXT NOT NULL,
     subject TEXT NOT NULL,
     provider TEXT NOT NULL,
     status TEXT NOT NULL,
     error TEXT,
     created_at TEXT DEFAULT (datetime('now'))`,
    'id, shipment_id, recipient, subject, provider, status, error, created_at'
  );
}
repairDanglingFks();

// Clean up any leftover legacy/repair tables from interrupted migrations.
for (const stale of ['shipments_legacy', 'shipments_new']) {
  if (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(stale)) {
    db.exec(`DROP TABLE IF EXISTS ${stale}`);
  }
}

// The old custom auth tables are replaced by Better Auth's user/session/account tables.
const legacyAuthTables = ['admin_users', 'sessions'];
for (const table of legacyAuthTables) {
  const found = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(table);
  if (found) {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
    console.log(`🗄️  Dropped legacy auth table: ${table}`);
  }
}

/* ---------------------------------- seed ---------------------------------- */

type SeedEvent = [status: string, location: string, note: string, happened_at: string];

interface SeedShipment {
  tracking_id: string;
  customer: string;
  customer_email?: string;
  cargo: string;
  origin: string;
  destination: string;
  weight: string;
  mode: string;
  status: string;
  eta: string;
  events: SeedEvent[];
}

const shipmentCount = (db.prepare('SELECT COUNT(*) AS n FROM shipments').get() as { n: number }).n;

const SEED: SeedShipment[] = [
  {
    tracking_id: 'TPC-2026-1042',
    customer: 'Adeola Textiles Ltd',
    customer_email: 'adeola@textiles.example.com',
    cargo: 'Textile fabrics (12 pallets)',
    origin: 'Lagos, Nigeria',
    destination: 'Shanghai, China',
    weight: '6,400 kg',
    mode: 'Sea',
    status: 'Delivered',
    eta: 'Delivered Aug 2, 2026',
    events: [
      ['Registered', 'Lagos, Nigeria', 'Shipment registered and documentation verified', 'Jul 14, 2026 · 09:12'],
      ['Picked Up', 'Onipetesi, Ikeja, Lagos', 'Cargo collected from consignor warehouse', 'Jul 15, 2026 · 11:40'],
      ['In Transit', 'Apapa Port, Lagos', 'Container loaded aboard MV Atlantic Star', 'Jul 17, 2026 · 16:05'],
      ['In Transit', 'Indian Ocean', 'Vessel crossing — all systems normal', 'Jul 25, 2026 · 08:30'],
      ['Customs', 'Port of Shanghai', 'Customs clearance in progress', 'Aug 1, 2026 · 10:22'],
      ['Delivered', 'Shanghai, China', 'Delivered to consignee — POD signed', 'Aug 2, 2026 · 14:15']
    ]
  },
  {
    tracking_id: 'TPC-2026-1077',
    customer: 'Greenfield Agro Exports',
    customer_email: 'ops@greenfieldagro.example.com',
    cargo: 'Dried produce (3 pallets)',
    origin: 'Ibadan, Nigeria',
    destination: 'London, United Kingdom',
    weight: '1,150 kg',
    mode: 'Air',
    status: 'In Transit',
    eta: 'Est. Aug 8, 2026',
    events: [
      ['Registered', 'Ibadan, Nigeria', 'Shipment registered and documentation verified', 'Aug 3, 2026 · 08:45'],
      ['Picked Up', 'Ibadan, Nigeria', 'Cargo collected from consignor facility', 'Aug 4, 2026 · 10:10'],
      ['In Transit', 'Murtala Muhammed Intl Airport, Lagos', 'Cargo received, air waybill issued', 'Aug 5, 2026 · 07:55'],
      ['In Transit', 'London Heathrow (LHR)', 'Flight LH-4 arrival — awaiting customs', 'Aug 6, 2026 · 05:20']
    ]
  },
  {
    tracking_id: 'TPC-2026-1081',
    customer: 'Chukwu Engineering Co.',
    customer_email: 'chukwu@engineering.example.com',
    cargo: 'Machinery spare parts (1 crate)',
    origin: 'Guangzhou, China',
    destination: 'Lagos, Nigeria',
    weight: '820 kg',
    mode: 'Air',
    status: 'Customs',
    eta: 'Est. Aug 7, 2026',
    events: [
      ['Registered', 'Guangzhou, China', 'Shipment registered and documentation verified', 'Aug 1, 2026 · 14:20'],
      ['Picked Up', 'Guangzhou, China', 'Cargo collected from supplier', 'Aug 2, 2026 · 09:00'],
      ['In Transit', 'Guangzhou Baiyun (CAN)', 'Departed on QR-1387', 'Aug 3, 2026 · 12:35'],
      ['Customs', 'Murtala Muhammed Intl Airport, Lagos', 'Clearance documents submitted to Nigeria Customs', 'Aug 5, 2026 · 11:48']
    ]
  },
  {
    tracking_id: 'TPC-2026-1055',
    customer: 'Amara Cosmetics',
    customer_email: 'orders@amara.example.com',
    cargo: 'Beauty products (2 pallets)',
    origin: 'Lagos, Nigeria',
    destination: 'Accra, Ghana',
    weight: '980 kg',
    mode: 'Road',
    status: 'Out for Delivery',
    eta: 'Est. Aug 6, 2026',
    events: [
      ['Registered', 'Lagos, Nigeria', 'Shipment registered and documentation verified', 'Aug 2, 2026 · 10:05'],
      ['Picked Up', 'Onipetesi, Ikeja, Lagos', 'Cargo collected from consignor warehouse', 'Aug 3, 2026 · 09:30'],
      ['In Transit', 'Benin City, Nigeria', 'Truck arrived — driver rest stop', 'Aug 4, 2026 · 18:12'],
      ['In Transit', 'Aflao Border, Ghana', 'Border crossing cleared', 'Aug 5, 2026 · 13:40'],
      ['Out for Delivery', 'Accra, Ghana', 'On last-mile delivery vehicle', 'Aug 6, 2026 · 08:15']
    ]
  },
  {
    tracking_id: 'TPC-2026-1086',
    customer: 'Efe Furniture Works',
    customer_email: 'logistics@efefurniture.example.com',
    cargo: 'Household furniture (2 containers)',
    origin: 'Tema, Ghana',
    destination: 'Kigali, Rwanda',
    weight: '18,200 kg',
    mode: 'Sea',
    status: 'In Transit',
    eta: 'Est. Aug 19, 2026',
    events: [
      ['Registered', 'Tema, Ghana', 'Shipment registered and documentation verified', 'Aug 4, 2026 · 15:00'],
      ['In Transit', 'Port of Tema', 'Containers loaded aboard MV Nile Voyager', 'Aug 5, 2026 · 19:44']
    ]
  },
  {
    tracking_id: 'TPC-2026-1090',
    customer: 'Bello & Sons Trading',
    customer_email: 'sales@belloandsons.example.com',
    cargo: 'Electronics (6 cartons)',
    origin: 'Lagos, Nigeria',
    destination: 'Dubai, UAE',
    weight: '340 kg',
    mode: 'Air',
    status: 'Registered',
    eta: 'Est. Aug 9, 2026',
    events: [
      ['Registered', 'Lagos, Nigeria', 'Shipment registered — documents under review', 'Aug 5, 2026 · 16:28']
    ]
  }
];

if (shipmentCount === 0) {
  const insertShipment = db.prepare(
    `INSERT INTO shipments (tracking_id, customer, customer_email, cargo, origin, destination, weight, mode, status, eta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertEvent = db.prepare(
    'INSERT INTO shipment_events (shipment_id, status, location, note, happened_at) VALUES (?, ?, ?, ?, ?)'
  );

  for (const s of SEED) {
    const result = insertShipment.run(
      s.tracking_id, s.customer, s.customer_email || null, s.cargo, s.origin, s.destination,
      s.weight, s.mode, s.status, s.eta
    );
    for (const [status, location, note, happened_at] of s.events) {
      insertEvent.run(result.lastInsertRowid, status, location, note, happened_at);
    }
  }
  console.log('📦 Seeded demo shipment data');
}

/* -------------------------------- helpers --------------------------------- */

export interface ShipmentRow {
  id: number;
  tracking_id: string;
  customer: string;
  customer_email: string | null;
  cargo: string;
  origin: string;
  destination: string;
  weight: string;
  mode: string;
  status: string;
  eta: string | null;
  created_at: string;
}

export interface ShipmentEventRow {
  status: string;
  location: string;
  note: string | null;
  happened_at: string;
}

export interface ShipmentJson {
  id: number;
  trackingId: string;
  customer: string;
  customerEmail: string;
  cargo: string;
  origin: string;
  destination: string;
  weight: string;
  mode: string;
  status: string;
  eta: string | null;
  events: ShipmentEventRow[];
}

export function findShipment(trackingId: string): ShipmentRow | undefined {
  return db.prepare('SELECT * FROM shipments WHERE tracking_id = ?').get(trackingId) as ShipmentRow | undefined;
}

export function shipmentEvents(shipmentId: number): ShipmentEventRow[] {
  return db
    .prepare('SELECT status, location, note, happened_at FROM shipment_events WHERE shipment_id = ? ORDER BY id')
    .all(shipmentId) as ShipmentEventRow[];
}

export function shipmentToJson(shipment: ShipmentRow): ShipmentJson {
  return {
    id: shipment.id,
    trackingId: shipment.tracking_id,
    customer: shipment.customer,
    customerEmail: shipment.customer_email || '',
    cargo: shipment.cargo,
    origin: shipment.origin,
    destination: shipment.destination,
    weight: shipment.weight,
    mode: shipment.mode,
    status: shipment.status,
    eta: shipment.eta,
    events: shipmentEvents(shipment.id)
  };
}
