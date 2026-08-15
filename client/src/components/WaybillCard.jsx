import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Ship, Truck, ArrowRight } from 'lucide-react';
import { trackShipment } from '../api.js';

/* IATA-style port codes for the cities TPC serves. */
const PORT_CODES = {
  Lagos: 'LOS', Ibadan: 'IBA', 'Port Harcourt': 'PHC', 'Benin City': 'BNI',
  Shanghai: 'SHA', London: 'LHR', Guangzhou: 'CAN', 'New York': 'JFK',
  Accra: 'ACC', Tema: 'TMA', Kigali: 'KGL', Dubai: 'DXB', Abuja: 'ABV'
};

const portCode = (city) => {
  const known = PORT_CODES[String(city).split(',')[0].trim()];
  if (known) return known;
  return String(city).replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '—';
};

const MODE_ICON = { Sea: Ship, Air: Plane, Road: Truck };

const FALLBACK = {
  trackingId: 'TPC-2026-1077',
  customer: 'Greenfield Agro Exports',
  cargo: 'Dried produce',
  origin: 'Ibadan, Nigeria',
  destination: 'London, United Kingdom',
  weight: '1,150 kg',
  mode: 'Air',
  status: 'In Transit',
  eta: 'Est. Aug 8, 2026'
};

const stampClass = (status) => {
  const s = String(status).toLowerCase();
  if (s.includes('deliver')) return 'stamp--delivered';
  if (s.includes('custom')) return 'stamp--customs';
  if (s.includes('transit') || s.includes('picked') || s.includes('out')) return 'stamp--transit';
  return 'stamp--pending';
};

/**
 * The Live Waybill — the site's signature element. A shipping document
 * rendered from real tracking data: the hero's centerpiece is TPC's
 * actual operational data, fetched from the API (falling back to a
 * seeded shipment when the API is unavailable).
 */
export default function WaybillCard({ fallbackId = 'TPC-2026-1077' }) {
  const [shipment, setShipment] = useState(FALLBACK);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    trackShipment(fallbackId)
      .then((data) => {
        if (!mounted) return;
        setShipment(data);
        setLive(true);
      })
      .catch(() => {
        /* API unreachable — keep the seeded fallback. */
      });
    return () => {
      mounted = false;
    };
  }, [fallbackId]);

  const ModeIcon = MODE_ICON[shipment.mode] || Plane;
  const eta = shipment.eta || '';

  return (
    <div className="waybill">
      <div className="waybill__sheen" aria-hidden="true" />
      <div className="waybill__head">
        <span className="waybill__brand">TPC<em> LOGISTICS</em></span>
        <span className="waybill__doc">
          AIR WAYBILL<br />No. {shipment.trackingId}
        </span>
      </div>

      <div className="waybill__route">
        <div className="waybill__port">
          <b>{portCode(shipment.origin)}</b>
          <span>{shipment.origin.split(',')[0]}</span>
        </div>
        <div className="waybill__line">
          <ModeIcon size={22} />
          <span>{live ? 'LIVE' : 'DIRECT'}</span>
        </div>
        <div className="waybill__port waybill__port--right">
          <b>{portCode(shipment.destination)}</b>
          <span>{shipment.destination.split(',')[0]}</span>
        </div>
      </div>

      <div className="waybill__grid">
        <div><span>Consignee</span><b>{shipment.customer}</b></div>
        <div><span>Cargo</span><b>{shipment.cargo}</b></div>
        <div><span>Weight</span><b>{shipment.weight}</b></div>
        <div><span>Mode</span><b>{shipment.mode} Freight</b></div>
      </div>

      <div className="waybill__status">
        <span className={`stamp ${stampClass(shipment.status)}`}>{shipment.status}</span>
        <span className="waybill__live"><i /> {live ? 'Live status' : 'Status'}</span>
      </div>

      <div className="waybill__foot">
        <span>{eta}</span>
        <Link to={`/tracking?q=${shipment.trackingId}`}>
          Track this shipment <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
