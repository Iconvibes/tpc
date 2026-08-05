import { useEffect, useState } from 'react';
import {
  Mail, FileText, Phone, CheckCircle2, Trash2, ChevronDown, ChevronUp, Clock4
} from 'lucide-react';
import { adminMessages, adminQuotes } from '../api.js';

export default function AdminInbox({ onStatsChange }) {
  const [kind, setKind] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');

  const refresh = () =>
    Promise.all([adminMessages.list(), adminQuotes.list()])
      .then(([m, q]) => {
        setMessages(m);
        setQuotes(q);
        onStatsChange();
      })
      .catch((err) => setError(err.message === 'AUTH_REQUIRED' ? 'Session expired — please sign in again.' : err.message));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = kind === 'messages' ? messages : quotes;

  const toggleHandled = async (id) => {
    try {
      if (kind === 'messages') await adminMessages.toggle(id);
      else await adminQuotes.toggle(id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this item permanently?')) return;
    try {
      if (kind === 'messages') await adminMessages.remove(id);
      else await adminQuotes.remove(id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="admin-hello">
        <div>
          <h1>Inbox</h1>
          <p>Contact messages and quote requests from the website — mark them handled as you respond.</p>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-seg">
        <button className={`admin-seg__btn ${kind === 'messages' ? 'admin-seg__btn--active' : ''}`} onClick={() => { setKind('messages'); setExpanded(null); }}>
          <Mail size={16} /> Messages ({messages.filter((m) => !m.handled).length} new)
        </button>
        <button className={`admin-seg__btn ${kind === 'quotes' ? 'admin-seg__btn--active' : ''}`} onClick={() => { setKind('quotes'); setExpanded(null); }}>
          <FileText size={16} /> Quotes ({quotes.filter((q) => !q.handled).length} new)
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="card admin-panel">
          <p className="admin-empty">Nothing here yet — new {kind} will appear as customers reach out.</p>
        </div>
      ) : (
        <div className="admin-list">
          {rows.map((item) => {
            const open = expanded === item.id;
            return (
              <div key={item.id} className={`card admin-item ${item.handled ? 'admin-item--handled' : ''}`}>
                <div className="admin-item__row">
                  <div className="admin-item__meta">
                    <span className="admin-avatar-sm">{item.name.slice(0, 1).toUpperCase()}</span>
                    <div>
                      <b>{item.name}</b>
                      <span>
                        {kind === 'messages' ? item.email : `${item.service} · ${item.email}`}
                        {item.phone ? ` · ${item.phone}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="admin-item__actions">
                    {!item.handled && <span className="admin-badge-new">New</span>}
                    <span className="admin-item__time"><Clock4 size={13} /> {item.created_at?.slice(0, 16).replace('T', ' ')}</span>
                    <button className="admin-icon-btn" title={item.handled ? 'Mark as new' : 'Mark as handled'} onClick={() => toggleHandled(item.id)}>
                      <CheckCircle2 size={18} />
                    </button>
                    <button className="admin-icon-btn admin-icon-btn--danger" title="Delete" onClick={() => remove(item.id)}>
                      <Trash2 size={18} />
                    </button>
                    <button className="admin-icon-btn" title={open ? 'Collapse' : 'Expand'} onClick={() => setExpanded(open ? null : item.id)}>
                      {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="admin-item__detail">
                    {kind === 'messages' ? (
                      <>
                        {item.subject && <p className="admin-item__subject">Subject: <b>{item.subject}</b></p>}
                        <p className="admin-item__message">{item.message}</p>
                      </>
                    ) : (
                      <div className="admin-detail-grid">
                        <div><span>Service</span><b>{item.service}</b></div>
                        <div><span>Route</span><b>{item.origin || '—'} → {item.destination || '—'}</b></div>
                        <div><span>Weight</span><b>{item.weight || '—'}</b></div>
                        <div><span>Company</span><b>{item.company || '—'}</b></div>
                        {item.note && (
                          <div style={{ gridColumn: '1 / -1' }}><span>Details</span><b>{item.note}</b></div>
                        )}
                      </div>
                    )}
                    <a className="admin-reply" href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(kind === 'messages' ? item.subject || 'Your message to TPC Logistics' : 'Your quote request')}`}>
                      <Mail size={15} /> Reply by email
                    </a>
                    {item.phone && <a className="admin-reply" href={`tel:${item.phone.replace(/[^+\d]/g, '')}`}><Phone size={15} /> Call {item.phone}</a>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
