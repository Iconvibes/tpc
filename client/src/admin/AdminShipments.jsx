import { useEffect, useState } from 'react';
import {
  Plus, Search, X, MapPin, Clock4, Trash2, Truck, Ship, Plane,
  Weight, Route, RefreshCw
} from 'lucide-react';
import { adminShipments } from '../api.js';

const STATUS_OPTIONS = ['Registered', 'Picked Up', 'In Transit', 'Customs', 'Out for Delivery', 'Delivered'];
const MODE_ICON = { Sea: Ship, Air: Plane, Road: Truck };
const statusKey = (s) => s.replace(/\s+/g, '');

const emptyForm = { customer: '', customer_email: '', cargo: '', origin: '', destination: '', weight: '', mode: 'Air' };
const emptyEvent = { status: 'In Transit', location: '', note: '', eta: '' };

export default function AdminShipments() {
  const [shipments, setShipments] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null); // shipment detail object
  const [detailLoading, setDetailLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const refresh = () =>
    adminShipments
      .list()
      .then(setShipments)
      .catch((err) => setError(err.message === 'AUTH_REQUIRED' ? 'Session expired — please sign in again.' : err.message));

  useEffect(() => {
    refresh();
  }, []);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setError('');
    try {
      const [detail, notifs] = await Promise.all([adminShipments.detail(id), adminShipments.notifications(id)]);
      setSelected(detail);
      setNotifications(notifs);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshNotifications = async () => {
    if (!selected) return;
    try {
      setNotifications(await adminShipments.notifications(selected.id));
    } catch {
      /* ignore */
    }
  };

  const afterCreate = (shipment) => {
    setShowCreate(false);
    refresh();
    openDetail(shipment.id);
  };

  const filtered = shipments.filter((s) => {
    const q = query.toLowerCase();
    return !q || [s.tracking_id, s.customer, s.cargo, s.origin, s.destination].some((f) => String(f).toLowerCase().includes(q));
  });

  return (
    <>
      <div className="admin-hello">
        <div>
          <h1>Shipments</h1>
          <p>Create shipments, update statuses — every change appears instantly on the public tracking page.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> New Shipment
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-search">
        <Search size={17} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by tracking ID, customer, cargo, route..." />
      </div>

      <div className="card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Customer / Cargo</th>
              <th>Route</th>
              <th>Mode</th>
              <th>Status</th>
              <th>ETA</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const ModeIcon = MODE_ICON[s.mode] || Truck;
              return (
                <tr key={s.id} onClick={() => openDetail(s.id)} className="admin-table__row">
                  <td><b className="admin-tid">{s.tracking_id}</b></td>
                  <td>
                    <b>{s.customer}</b>
                    <span className="admin-table__sub">{s.cargo}</span>
                  </td>
                  <td><span className="admin-table__sub">{s.origin} → {s.destination}</span></td>
                  <td><span className="admin-mode"><ModeIcon size={14} /> {s.mode}</span></td>
                  <td><span className={`admin-status admin-status--${statusKey(s.status)}`}>{s.status}</span></td>
                  <td><span className="admin-table__sub">{s.eta || '—'}</span></td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="admin-empty">No shipments match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateShipmentModal onClose={() => setShowCreate(false)} onCreated={afterCreate} />
      )}

      {detailLoading && (
        <div className="admin-drawer-overlay"><div className="admin-drawer"><div className="track-loading" style={{ marginTop: 20 }}><span className="spinner" /> Loading shipment...</div></div></div>
      )}

      {selected && !detailLoading && (
        <ShipmentDrawer
          shipment={selected}
          notifications={notifications}
          onClose={() => setSelected(null)}
          onChanged={(updated) => { setSelected(updated); refresh(); refreshNotifications(); }}
          onDeleted={() => { setSelected(null); refresh(); }}
        />
      )}
    </>
  );
}

/* ---------------------------- create modal ---------------------------- */

function CreateShipmentModal({ onClose, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const created = await adminShipments.create(form);
      onCreated(created);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <h3>New Shipment</h3>
            <p>A tracking ID is generated automatically (e.g. TPC-2026-1092).</p>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>
        <div className="modal__body">
          <form onSubmit={submit} noValidate>
            <div className="form-grid">
              <div className="field field--full">
                <label htmlFor="ns-customer">Customer *</label>
                <input id="ns-customer" value={form.customer} onChange={set('customer')} placeholder="Customer / company name" />
              </div>
              <div className="field field--full">
                <label htmlFor="ns-email">Customer email (for status alerts)</label>
                <input id="ns-email" type="email" value={form.customer_email} onChange={set('customer_email')} placeholder="customer@company.com — optional" />
              </div>
              <div className="field field--full">
                <label htmlFor="ns-cargo">Cargo *</label>
                <input id="ns-cargo" value={form.cargo} onChange={set('cargo')} placeholder="e.g. Electronics (4 pallets)" />
              </div>
              <div className="field">
                <label htmlFor="ns-origin">Origin *</label>
                <input id="ns-origin" value={form.origin} onChange={set('origin')} placeholder="City, Country" />
              </div>
              <div className="field">
                <label htmlFor="ns-dest">Destination *</label>
                <input id="ns-dest" value={form.destination} onChange={set('destination')} placeholder="City, Country" />
              </div>
              <div className="field">
                <label htmlFor="ns-weight">Weight *</label>
                <input id="ns-weight" value={form.weight} onChange={set('weight')} placeholder="e.g. 2,000 kg" />
              </div>
              <div className="field">
                <label htmlFor="ns-mode">Mode *</label>
                <select id="ns-mode" value={form.mode} onChange={set('mode')}>
                  {['Air', 'Sea', 'Road'].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              {error && <p className="field--full admin-error">{error}</p>}
              <div className="field--full">
                <button className="btn btn--primary btn--block" disabled={busy}>
                  {busy ? 'Creating...' : 'Create Shipment'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- detail drawer ---------------------------- */

function ShipmentDrawer({ shipment, onClose, onChanged, onDeleted, notifications }) {
  const [event, setEvent] = useState(emptyEvent);
  const [edit, setEdit] = useState({
    customer: shipment.customer, customer_email: shipment.customerEmail || '', cargo: shipment.cargo, origin: shipment.origin,
    destination: shipment.destination, weight: shipment.weight, eta: shipment.eta || '', mode: shipment.mode
  });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setE = (key) => (e) => setEvent((f) => ({ ...f, [key]: e.target.value }));
  const setF = (key) => (e) => setEdit((f) => ({ ...f, [key]: e.target.value }));

  const addEvent = async (e) => {
    e.preventDefault();
    setError('');
    if (!event.location.trim()) return setError('Location is required for a status update.');
    setBusy(true);
    try {
      const updated = await adminShipments.addEvent(shipment.id, event);
      setEvent(emptyEvent);
      onChanged(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const updated = await adminShipments.update(shipment.id, edit);
      setEditing(false);
      onChanged(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete shipment ${shipment.trackingId} permanently? This cannot be undone.`)) return;
    try {
      await adminShipments.remove(shipment.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
    }
  };

  const ModeIcon = MODE_ICON[shipment.mode] || Truck;

  return (
    <div className="admin-drawer-overlay" onClick={onClose}>
      <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="admin-drawer__head">
          <div>
            <h2>{shipment.trackingId}</h2>
            <p>{shipment.cargo}</p>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close"><X size={19} /></button>
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-drawer__status">
          <span className={`status-pill status-pill--${statusKey(shipment.status)}`}>
            <span className="dot" /> {shipment.status}
          </span>
          <span className="admin-drawer__eta"><Clock4 size={14} /> {shipment.eta}</span>
        </div>

        <div className="admin-detail-grid admin-drawer__details">
          <div><span>Customer</span><b>{shipment.customer}</b></div>
          <div><span><Route size={12} /> Route</span><b>{shipment.origin} → {shipment.destination}</b></div>
          <div><span><ModeIcon size={12} /> Mode</span><b>{shipment.mode} Freight</b></div>
          <div><span><Weight size={12} /> Weight</span><b>{shipment.weight}</b></div>
          <div style={{ gridColumn: '1 / -1' }}><span>Customer email</span><b>{shipment.customerEmail || '— no email set —'}</b></div>
        </div>

        {/* Add event */}
        <div className="admin-section">
          <h3>Update status</h3>
          <form className="admin-event-form" onSubmit={addEvent} noValidate>
            <div className="field">
              <label htmlFor="ev-status">Status</label>
              <select id="ev-status" value={event.status} onChange={setE('status')}>
                {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ev-location">Location *</label>
              <input id="ev-location" value={event.location} onChange={setE('location')} placeholder="e.g. Apapa Port, Lagos" />
            </div>
            <div className="field">
              <label htmlFor="ev-note">Note</label>
              <input id="ev-note" value={event.note} onChange={setE('note')} placeholder="e.g. Container loaded aboard MV X" />
            </div>
            <div className="field">
              <label htmlFor="ev-eta">ETA (optional)</label>
              <input id="ev-eta" value={event.eta} onChange={setE('eta')} placeholder="e.g. Est. Aug 12, 2026" />
            </div>
            <button className="btn btn--primary" disabled={busy} style={{ alignSelf: 'end' }}>
              <RefreshCw size={16} /> {busy ? 'Saving...' : 'Update'}
            </button>
          </form>
        </div>

        {/* Status emails */}
        <div className="admin-section">
          <h3>Status emails ({notifications.length})</h3>
          {notifications.length === 0 ? (
            <p className="admin-muted">No emails sent yet — add a customer email and update the status to notify them.</p>
          ) : (
            <ul className="admin-notifs">
              {notifications.map((n) => (
                <li key={n.id}>
                  <span className={`admin-notifs__dot ${n.status === 'error' ? 'is-error' : ''}`} />
                  <div>
                    <b>{n.subject}</b>
                    <p>→ {n.recipient} · via {n.provider} · {n.status === 'error' ? n.error : n.status}</p>
                  </div>
                  <span className="admin-feed__time">{n.created_at?.slice(0, 16).replace('T', ' ')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Timeline */}
        <div className="admin-section">
          <h3>Timeline ({shipment.events.length})</h3>
          <div className="timeline">
            {[...shipment.events].reverse().map((ev, i) => (
              <div key={i} className={i === 0 ? 'timeline__item timeline__item--current' : 'timeline__item timeline__item--done'}>
                <span className="timeline__dot" />
                <b>{ev.status}</b>
                <div className="loc"><MapPin size={14} /> {ev.location}</div>
                {ev.note && <p className="note">{ev.note}</p>}
                <span className="when">{ev.happened_at}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit details */}
        <div className="admin-section">
          <h3 style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
            Shipment details
            <button className="admin-link" onClick={() => setEditing((v) => !v)}>{editing ? 'Cancel' : 'Edit'}</button>
          </h3>
          {editing ? (
            <form className="admin-event-form" onSubmit={saveEdit} noValidate>
              <div className="field"><label>Customer</label><input value={edit.customer} onChange={setF('customer')} /></div>
              <div className="field"><label>Customer email</label><input type="email" value={edit.customer_email} onChange={setF('customer_email')} placeholder="for status alerts" /></div>
              <div className="field"><label>Cargo</label><input value={edit.cargo} onChange={setF('cargo')} /></div>
              <div className="field"><label>Origin</label><input value={edit.origin} onChange={setF('origin')} /></div>
              <div className="field"><label>Destination</label><input value={edit.destination} onChange={setF('destination')} /></div>
              <div className="field"><label>Weight</label><input value={edit.weight} onChange={setF('weight')} /></div>
              <div className="field">
                <label>Mode</label>
                <select value={edit.mode} onChange={setF('mode')}>
                  {['Air', 'Sea', 'Road'].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="field"><label>ETA</label><input value={edit.eta} onChange={setF('eta')} /></div>
              <button className="btn btn--dark" disabled={busy} style={{ alignSelf: 'end' }}>Save</button>
            </form>
          ) : (
            <p className="admin-muted">Last edited via the operations console — corrections available in edit mode.</p>
          )}
        </div>

        <button className="admin-danger" onClick={remove}><Trash2 size={15} /> Delete shipment</button>
      </div>
    </div>
  );
}
