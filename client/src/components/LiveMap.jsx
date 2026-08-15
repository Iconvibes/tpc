import { useEffect, useRef } from 'react';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

/* ------------------------------------------------------------------ */
/*  Fallback — abstract live-route network (no token needed)          */
/* ------------------------------------------------------------------ */

const CITIES = [
  { id: 'LOS', name: 'Lagos', x: 0.13, y: 0.76 },
  { id: 'IBA', name: 'Ibadan', x: 0.1, y: 0.8 },
  { id: 'ABV', name: 'Abuja', x: 0.15, y: 0.66 },
  { id: 'ACC', name: 'Accra', x: 0.06, y: 0.84 },
  { id: 'KGL', name: 'Kigali', x: 0.24, y: 0.74 },
  { id: 'DXB', name: 'Dubai', x: 0.58, y: 0.44 },
  { id: 'LHR', name: 'London', x: 0.4, y: 0.16 },
  { id: 'JFK', name: 'New York', x: 0.26, y: 0.24 },
  { id: 'SHA', name: 'Shanghai', x: 0.86, y: 0.4 },
  { id: 'CAN', name: 'Guangzhou', x: 0.84, y: 0.56 }
];

const ROUTES = [
  ['LOS', 'SHA'], ['LOS', 'LHR'], ['LOS', 'DXB'], ['IBA', 'LHR'],
  ['ACC', 'KGL'], ['LOS', 'JFK'], ['ABV', 'DXB'], ['LOS', 'CAN']
];

const VW = 1000;
const VH = 520;

function pt(c) {
  return { x: c.x * VW, y: c.y * VH };
}

function arcPath(a, b) {
  const p1 = pt(a);
  const p2 = pt(b);
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  const bow = Math.min(0.32 * len, 150);
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * bow;
  const cy = my + ny * bow;
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

function RouteNetwork({ height }) {
  const wrapRef = useRef(null);
  const dotsRef = useRef([]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const paths = wrapRef.current ? wrapRef.current.querySelectorAll('.rnet__path') : [];
    const dots = dotsRef.current;
    const speed = 0.0014 + Math.random() * 0.0012;
    let t = Math.random();

    let raf;
    const tick = () => {
      t += speed;
      dots.forEach((dot, i) => {
        if (!dot) return;
        const path = paths[i % paths.length];
        if (!path) return;
        const len = path.getTotalLength();
        const p = ((t * (1 + (i % 3) * 0.5)) % 1);
        const point = path.getPointAtLength((p + 0.5) % 1 * len);
        dot.setAttribute('cx', point.x.toFixed(1));
        dot.setAttribute('cy', point.y.toFixed(1));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const byId = (id) => CITIES.find((c) => c.id === id);

  return (
    <div className="rnet" ref={wrapRef} style={{ height }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {/* faint graticule-free ocean speckle */}
        <g className="rnet__speck">
          {Array.from({ length: 60 }).map((_, i) => {
            const x = ((i * 173) % VW);
            const y = ((i * 97 + 41) % VH);
            return <circle key={i} cx={x} cy={y} r="1.4" />;
          })}
        </g>

        {ROUTES.map(([a, b], i) => (
          <g key={i}>
            <path className="rnet__path" d={arcPath(byId(a), byId(b))} />
          </g>
        ))}

        {CITIES.map((c) => (
          <g key={c.id} className="rnet__city" style={{ transform: `translate(${c.x * VW}px, ${c.y * VH}px)` }}>
            <circle className="rnet__pulse" r="14" />
            <circle className="rnet__node" r="4.5" />
            <text x="10" y="4">{c.id}</text>
          </g>
        ))}
      </svg>
      {ROUTES.map((r, i) => (
        <svg key={i} className="rnet__dots" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <circle
            className="rnet__dot"
            ref={(el) => { dotsRef.current[i] = el; }}
            r="4.5"
          />
        </svg>
      ))}
      <div className="rnet__legend">
        <span><i className="rnet__legend-dot" /> LIVE UNITS</span>
        <span><i className="rnet__legend-node" /> GATEWAYS</span>
        <span className="rnet__legend-clock">LOS·LHR·DXB·SHA·JFK</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mapbox GL branch (enabled by setting VITE_MAPBOX_TOKEN)            */
/* ------------------------------------------------------------------ */

function MapboxMap({ height }) {
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let map;
    let raf;
    const trucks = {};
    let t = 0;

    async function init() {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled) return;
      mapboxgl.accessToken = TOKEN;
      map = new mapboxgl.Map({
        container: ref.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [8.5, 9.5],
        zoom: 1.4,
        attributionControl: false
      });

      const routeLines = ROUTES.map(([a, b]) => {
        const pa = byId(a); const pb = byId(b);
        const fa = pt(pa); const fb = pt(pb);
        // approximate lon/lat from our abstract grid
        const la = [fa.x / VW * 70 - 30, 60 - fa.y / VH * 90];
        const lb = [fb.x / VW * 70 - 30, 60 - fb.y / VH * 90];
        const mid = [(la[0] + lb[0]) / 2, (la[1] + lb[1]) / 2];
        const bow = Math.min(30, Math.hypot(lb[0] - la[0], lb[1] - la[1]) * 0.3);
        const steps = 60;
        const coords = [];
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const bx = (1 - u) * (1 - u) * la[0] + 2 * (1 - u) * u * mid[0] + u * u * lb[0];
          const by = (1 - u) * (1 - u) * la[1] + 2 * (1 - u) * u * mid[1] + u * u * lb[1];
          coords.push([bx, by]);
        }
        return coords;
      });

      map.on('load', () => {
        map.addSource('routes', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: routeLines.map((coords, i) => ({
              type: 'Feature',
              geometry: { type: 'LineString', coordinates: coords },
              properties: { id: i }
            }))
          }
        });
        map.addLayer({
          id: 'route-bg',
          type: 'line',
          source: 'routes',
          paint: { 'line-color': '#FFB800', 'line-opacity': 0.12, 'line-width': 5 }
        });
        map.addLayer({
          id: 'routes',
          type: 'line',
          source: 'routes',
          paint: { 'line-color': '#FFB800', 'line-opacity': 0.5, 'line-width': 1.4, 'line-dasharray': [1.2, 2.2] }
        });

        routeLines.forEach((coords, i) => {
          trucks[i] = { idx: 0, coords, speed: 0.15 + Math.random() * 0.2 };
        });
        map.addSource('trucks', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
        map.addLayer({
          id: 'trucks',
          type: 'circle',
          source: 'trucks',
          paint: {
            'circle-color': '#FFB800',
            'circle-radius': 4,
            'circle-stroke-color': '#0A0A0A',
            'circle-stroke-width': 1.5
          }
        });

        const animate = () => {
          t += 1;
          const features = [];
          Object.values(trucks).forEach((tr) => {
            tr.idx = (tr.idx + tr.speed) % tr.coords.length;
            const a = tr.coords[Math.floor(tr.idx)];
            features.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: a }
            });
          });
          const src = map.getSource('trucks');
          if (src) src.setData({ type: 'FeatureCollection', features });
          raf = requestAnimationFrame(animate);
        };
        animate();
      });
    }

    init();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      map?.remove();
    };
  }, []);

  return <div className="rnet rnet--mapbox" ref={ref} style={{ height }} />;
}

/* ------------------------------------------------------------------ */

export default function LiveMap({ height = 420 }) {
  return TOKEN ? <MapboxMap height={height} /> : <RouteNetwork height={height} />;
}
