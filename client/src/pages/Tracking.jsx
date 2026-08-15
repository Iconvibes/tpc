import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, MapPin, Clock4, Package, Boxes, Weight, Route,
  SearchX, AlertTriangle, Truck, Ship, Plane, ArrowUpRight
} from 'lucide-react';
import Reveal from '../components/Reveal.jsx';
import LiveMap from '../components/LiveMap.jsx';
import { trackShipment } from '../api.js';

const SAMPLE_IDS = ['TPC-2026-1077', 'TPC-2026-1081', 'TPC-2026-1055', 'TPC-2026-1086', 'TPC-2026-1090'];
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
        <div className="container page-hero__inner track-hero">
          <Reveal>
            <span className="crumb">HOME <span>/</span> TRACKING</span>
            <h1>
              TRACK YOUR CARGO<span className="hero__caret" />
            </h1>
            <p className="page-hero__sub">
              Enter your tracking ID to see live status, current location and every milestone —
              from registration to final delivery.
            </p>

            <form className="track-search-big" onSubmit={onSubmit}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter tracking ID — e.g. TPC-2026-1042"
                aria-label="Tracking ID"
                spellCheck="false"
              />
              <button className="btn btn--yellow" type="submit" disabled={loading}>
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
            <p className="track-note">Try one of the demo IDs above to see tracking in action.</p>
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
                <div className="track-error">
                  <span className="track-error__ico"><SearchX size={30} /></span>
                  <h3>Shipment not found</h3>
                  <p>{error}</p>
                  <button className="btn btn--yellow" onClick={() => setQuery('TPC-2026-1077')}>
                    Try a demo tracking ID <ArrowUpRight size={16} />
                  </button>
                </div>
              </Reveal>
            </div>
          )}

          {!loading && !error && !shipment && searched && (
            <div className="track-feedback">
              <Reveal>
                <div className="track-error">
                  <span className="track-error__ico track-error__ico--warn"><AlertTriangle size={30} /></span>
                  <h3>Enter a tracking ID</h3>
                  <p>Type your tracking ID above or pick one of the demo IDs to explore.</p>
                </div>
              </Reveal>
            </div>
          )}

          {!loading && shipment && (
            <div className="track-result">
              <Reveal>
                <div className="result-card">
                  <div className="result-card__head">
                    <div>
                      <span className="result-card__kicker">SHIPMENT {shipment.trackingId}</span>
                      <h3>{shipment.cargo}</h3>
                      <span className="result-card__customer">{shipment.customer}</span>
                    </div>
                    <span className="id">{shipment.trackingId}</span>
                  </div>

                  <div className="result-card__meta">
                    <span className={`status-pill status-pill--${statusKey(shipment.status)}`}>
                      <span className="dot" /> {shipment.status}
                    </span>
                    <span className="result-card__eta"><Clock4 size={15} /> {shipment.eta}</span>
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
                <div className="timeline">
                  <div className="timeline__head">
                    <h3>Shipment journey</h3>
                    <span className="mono">{shipment.events.length} MILESTONES</span>
                  </div>
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

      {/* live network strip */}
      <section className="section track-section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="section-head section-head--center">
              <span className="eyebrow">TRACK-04 · NETWORK</span>
              <h2>Our live network</h2>
              <p>Animated units move along active TPC corridors in real time.</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="map-frame">
              <div className="map-frame__top">
                <span><i className="map-frame__live-dot" /> LIVE NETWORK</span>
                <span className="mono">LOS · ACC · DXB · LHR · SHA · JFK</span>
              </div>
              <LiveMap height={420} />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
