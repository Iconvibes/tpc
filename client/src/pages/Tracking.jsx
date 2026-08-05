import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Search, ChevronRight, MapPin, Clock4, Package, Boxes, Weight, Route,
  SearchX, AlertTriangle, Truck, Ship, Plane
} from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import { trackShipment } from '../api.js';

const SAMPLE_IDS = ['TPC-2026-1042', 'TPC-2026-1077', 'TPC-2026-1081', 'TPC-2026-1055', 'TPC-2026-1090'];
const MODE_ICON = { Sea: Ship, Air: Plane, Road: Truck };
const statusKey = (s) => s.replace(/\s+/g, '');

export default function Tracking() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [shipment, setShipment] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const lookup = async (id) => {
    const value = id.trim();
    if (!value) {
      setError('Please enter a tracking ID first.');
      setShipment(null);
      setSearched(true);
      return;
    }
    setLoading(true);
    setError('');
    setShipment(null);
    setSearched(true);
    try {
      const data = await trackShipment(value);
      setShipment(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = params.get('q');
    if (q) lookup(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    lookup(query);
  };

  return (
    <>
      <section className="page-hero">
        <div className="container track-hero">
          <Reveal>
            <span className="crumb">Home <ChevronRight size={13} /> Tracking</span>
            <h1>Track your shipment in real time</h1>
            <p>
              Enter your tracking ID to see live status, current location and every milestone —
              from registration to final delivery.
            </p>
            <form className="track-search-big" onSubmit={onSubmit}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter tracking ID — e.g. TPC-2026-1042"
                aria-label="Tracking ID"
              />
              <button className="btn btn--primary" type="submit" disabled={loading}>
                <Search size={18} /> {loading ? 'Tracking...' : 'Track'}
              </button>
            </form>
            <div className="track-hints">
              {SAMPLE_IDS.map((id) => (
                <button key={id} className="track-hint" onClick={() => { setQuery(id); lookup(id); }}>
                  {id}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 16, fontSize: '0.85rem', color: '#8fa4c0' }}>
              Try one of the demo IDs above to see tracking in action.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {loading && (
            <div className="track-loading">
              <span className="spinner" /> Fetching your shipment...
            </div>
          )}

          {!loading && error && (
            <div className="track-feedback">
              <Reveal>
                <div className="card track-error">
                  <span className="ico"><SearchX size={30} /></span>
                  <h3>Shipment not found</h3>
                  <p>{error}</p>
                  <button className="btn btn--dark" onClick={() => setQuery('TPC-2026-1042')}>
                    Try a demo tracking ID
                  </button>
                </div>
              </Reveal>
            </div>
          )}

          {!loading && !error && !shipment && searched && (
            <div className="track-feedback">
              <Reveal>
                <div className="card track-error">
                  <span className="ico" style={{ color: 'var(--brand-deep)', background: 'rgba(245,166,35,0.12)' }}>
                    <AlertTriangle size={30} />
                  </span>
                  <h3>Enter a tracking ID</h3>
                  <p>Type your tracking ID above or pick one of the demo IDs to explore.</p>
                </div>
              </Reveal>
            </div>
          )}

          {!loading && shipment && (
            <div className="track-result">
              <Reveal>
                <div className="card result-card">
                  <div className="result-card__head">
                    <div>
                      <h3>{shipment.cargo}</h3>
                      <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{shipment.customer}</span>
                    </div>
                    <span className="id">{shipment.trackingId}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
                    <span className={`status-pill status-pill--${statusKey(shipment.status)}`}>
                      <span className="dot" /> {shipment.status}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 700 }}>
                      <Clock4 size={15} /> {shipment.eta}
                    </span>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-box">
                      <span><Route size={13} /> Route</span>
                      <b>{shipment.origin} → {shipment.destination}</b>
                    </div>
                    <div className="detail-box">
                      <span><Package size={13} /> Mode</span>
                      <b style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {(() => { const M = MODE_ICON[shipment.mode] || Truck; return <M size={15} />; })()}
                        {shipment.mode} Freight
                      </b>
                    </div>
                    <div className="detail-box">
                      <span><Weight size={13} /> Weight</span>
                      <b>{shipment.weight}</b>
                    </div>
                    <div className="detail-box">
                      <span><Boxes size={13} /> Status</span>
                      <b>{shipment.status}</b>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div className="card timeline">
                  <h3>Shipment journey</h3>
                  {shipment.events.map((ev, i) => {
                    const isLast = i === shipment.events.length - 1;
                    const isDelivered = shipment.status === 'Delivered';
                    const cls = isLast && !isDelivered ? 'timeline__item timeline__item--current' : 'timeline__item timeline__item--done';
                    return (
                      <div key={i} className={cls}>
                        <span className="timeline__dot" />
                        <b>{ev.status}</b>
                        <div className="loc"><MapPin size={14} /> {ev.location}</div>
                        <p className="note">{ev.note}</p>
                        <span className="when">{ev.happened_at}</span>
                      </div>
                    );
                  })}
                </div>
              </Reveal>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
