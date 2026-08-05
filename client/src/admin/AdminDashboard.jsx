import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  LayoutDashboard, Inbox, Package, Settings, LogOut, ArrowLeft, ArrowRight,
  Mail, FileText, Truck, TrendingUp
} from 'lucide-react';
import { authClient } from '../auth-client.js';
import { adminMessages, adminQuotes, adminShipments } from '../api.js';
import AdminInbox from './AdminInbox.jsx';
import AdminShipments from './AdminShipments.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'shipments', label: 'Shipments', icon: Package },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export default function AdminDashboard({ user }) {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const username = user.name || user.email;

  const logout = async () => {
    await authClient.signOut();
    // useSession() in AdminApp reacts to the signed-out state automatically.
  };


  const loadStats = () =>
    Promise.all([adminMessages.list(), adminQuotes.list(), adminShipments.list()]).then(
      ([messages, quotes, shipments]) =>
        setStats({
          unreadMessages: messages.filter((m) => !m.handled).length,
          newQuotes: quotes.filter((q) => !q.handled).length,
          activeShipments: shipments.filter((s) => s.status !== 'Delivered').length,
          totalShipments: shipments.length
        })
    );

  useEffect(() => {
    if (tab === 'overview') loadStats().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="admin">
      <header className="admin__topbar">
        <div className="admin__topbar-inner">
          <Link to="/" className="logo" aria-label="Back to website">
            <span className="logo__mark">
              <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path d="M6 38h34v-9a5 5 0 0 0-5-5h-9V16a5 5 0 0 0-5-5H12a5 5 0 0 0-5 5v22z" fill="currentColor" />
                <circle cx="17" cy="48" r="6" fill="#eaf2fb" />
                <circle cx="46" cy="48" r="6" fill="#eaf2fb" />
                <path d="M45 22h7l7 9v7H45z" fill="currentColor" opacity="0.85" />
              </svg>
            </span>
            <span>
              <span className="logo__name">TPC<span> Admin</span></span>
              <span className="logo__tag">Operations Console</span>
            </span>
          </Link>
          <div className="admin__user">
            <span className="admin__avatar">{username.slice(0, 1).toUpperCase()}</span>
            <span>{username}</span>
            <button className="btn btn--ghost" onClick={logout} style={{ padding: '9px 16px' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="admin__tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`admin__tab ${tab === t.id ? 'admin__tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={17} /> {t.label}
              {t.id === 'inbox' && stats && (stats.unreadMessages + stats.newQuotes > 0) && (
                <span className="admin__badge">{stats.unreadMessages + stats.newQuotes}</span>
              )}
            </button>
          );
        })}
      </div>

      <main className="admin__content">
        {tab === 'overview' && <Overview stats={stats} onNavigate={setTab} username={username} />}
        {tab === 'inbox' && <AdminInbox onStatsChange={loadStats} />}
        {tab === 'shipments' && <AdminShipments />}
        {tab === 'settings' && <AccountSettings />}
      </main>
    </div>
  );
}

/* ------------------------------- Overview -------------------------------- */

function Overview({ stats, onNavigate, username }) {
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentShipments, setRecentShipments] = useState([]);

  useEffect(() => {
    adminMessages
      .list()
      .then((m) => setRecentMessages(m.slice(0, 4)))
      .catch(() => {});
    adminShipments
      .list()
      .then((s) => setRecentShipments(s.slice(0, 5)))
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Unread messages', value: stats?.unreadMessages ?? '—', icon: Mail, tone: 'amber' },
    { label: 'New quote requests', value: stats?.newQuotes ?? '—', icon: FileText, tone: 'blue' },
    { label: 'Active shipments', value: stats?.activeShipments ?? '—', icon: Truck, tone: 'green' },
    { label: 'Total shipments', value: stats?.totalShipments ?? '—', icon: TrendingUp, tone: 'navy' }
  ];

  return (
    <>
      <div className="admin-hello">
        <div>
          <h1>Welcome back, {username}</h1>
          <p>Here's what's happening across TPC Logistics today.</p>
        </div>
        <button className="btn btn--primary" onClick={() => onNavigate('shipments')}>
          New Shipment <ArrowRight size={17} />
        </button>
      </div>

      <div className="admin-stats">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`admin-stat admin-stat--${c.tone}`}>
              <span className="admin-stat__ico"><Icon size={22} /></span>
              <div>
                <b>{c.value}</b>
                <span>{c.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-cols">
        <div className="card admin-panel">
          <div className="admin-panel__head">
            <h3><Mail size={18} /> Latest messages</h3>
            <button className="admin-link" onClick={() => onNavigate('inbox')}>View all <ArrowRight size={14} /></button>
          </div>
          {recentMessages.length === 0 ? (
            <p className="admin-empty">No messages yet — they'll appear here when customers reach out.</p>
          ) : (
            <ul className="admin-feed">
              {recentMessages.map((m) => (
                <li key={m.id}>
                  <span className={`admin-feed__dot ${m.handled ? 'is-handled' : ''}`} />
                  <div>
                    <b>{m.name} <span>{m.handled ? '· handled' : '· new'}</span></b>
                    <p>{m.message.slice(0, 90)}{m.message.length > 90 ? '…' : ''}</p>
                  </div>
                  <span className="admin-feed__time">{m.created_at?.slice(0, 16).replace('T', ' ')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card admin-panel">
          <div className="admin-panel__head">
            <h3><Truck size={18} /> Recent shipments</h3>
            <button className="admin-link" onClick={() => onNavigate('shipments')}>Manage <ArrowRight size={14} /></button>
          </div>
          {recentShipments.length === 0 ? (
            <p className="admin-empty">No shipments yet.</p>
          ) : (
            <ul className="admin-feed">
              {recentShipments.map((s) => (
                <li key={s.id}>
                  <span className="admin-feed__dot" style={{ background: 'var(--brand)' }} />
                  <div>
                    <b>{s.tracking_id} <span>· {s.cargo.slice(0, 40)}{s.cargo.length > 40 ? '…' : ''}</span></b>
                    <p>{s.origin} → {s.destination}</p>
                  </div>
                  <span className={`admin-status admin-status--${s.status.replace(/\s+/g, '')}`}>{s.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------- Settings -------------------------------- */

function AccountSettings() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setDone(false);
    if (form.next.length < 8) return setError('New password must be at least 8 characters.');
    if (form.next !== form.confirm) return setError('New passwords do not match.');
    setBusy(true);      try {
      await authClient.changePassword({ currentPassword: form.current, newPassword: form.next });
      setDone(true);
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setError(err.message || 'Could not update the password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-settings-wrap">
      <div className="admin-hello">
        <div>
          <h1>Settings</h1>
          <p>Update your admin password. Sessions stay active.</p>
        </div>
      </div>

      <div className="card admin-panel" style={{ maxWidth: 520 }}>
        {done && <p className="admin-success">✓ Password updated successfully.</p>}
        <form onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="s-current">Current password</label>
            <input id="s-current" type="password" value={form.current} onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="s-next">New password</label>
            <input id="s-next" type="password" value={form.next} onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="s-confirm">Confirm new password</label>
            <input id="s-confirm" type="password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} />
          </div>
          {error && <p className="admin-error">{error}</p>}
          <button className="btn btn--primary" disabled={busy} style={{ marginTop: 6 }}>
            {busy ? 'Updating...' : 'Update Password'} <ArrowLeft size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
