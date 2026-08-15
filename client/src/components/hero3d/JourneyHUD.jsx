import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { journeyProgress, scrollProgress } from '../../lib/journey.js';

/**
 * JourneyHUD — the dispatcher-camera feed. A small mono-type corner card with
 * live stats (speed, ETA, coordinates, leg) driven by the journey store.
 *
 * This is a PLAIN DOM overlay (lives outside the R3F canvas — it must never
 * be rendered as a Canvas child). A requestAnimationFrame loop reads the
 * store and writes textContent/style directly, so no React re-renders occur.
 */

/* -------- the route in real geography: IKEJA → London (via waypoints) -------- */
const ROUTE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(6.5962, 3.3376, 0), // IKEJA
  new THREE.Vector3(9.0765, 7.3986, 0), // ABUJA
  new THREE.Vector3(23.0060, 4.8620, 0), // N'DJAMENA (Sahara crossing)
  new THREE.Vector3(36.7538, 3.0588, 0), // ALGIERS
  new THREE.Vector3(40.4168, -3.7038, 0), // MADRID
  new THREE.Vector3(51.4700, -0.4543, 0) // LHR
], false, 'catmullrom', 0.55);

const TOTAL_HOURS = 16; // the truck's full IKEJA→LHR transit
const v = new THREE.Vector3();

function pad(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

/** The leg the truck is currently between. */
function currentLeg(u) {
  if (u < 0.2) return { from: 'IKEJA', to: 'LAGOS', status: 'DEPARTURE' };
  if (u < 0.55) return { from: 'LAGOS', to: 'EUROPE', status: 'IN TRANSIT' };
  if (u < 0.98) return { from: 'EUROPE', to: 'LHR', status: 'IN TRANSIT' };
  return { from: 'LHR', to: '—', status: 'DELIVERED' };
}

export default function JourneyHUD({ storeRef, reduced }) {
  const cardRef = useRef();
  const speedEl = useRef();
  const etaEl = useRef();
  const latEl = useRef();
  const lonEl = useRef();
  const legEl = useRef();
  const statusEl = useRef();
  const barEl = useRef();
  const smoothSpeed = useRef(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let paused = false;

    // pause the feed when the HUD is off-screen (it's a fixed overlay, so
    // it's only ever off-screen when the whole page is scrolled past it)
    const io = new IntersectionObserver(([entry]) => {
      paused = !entry.isIntersecting;
      if (!paused) last = performance.now(); // avoid a dt spike on resume
    });
    if (cardRef.current) io.observe(cardRef.current);

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (paused) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const store = storeRef.current;
      if (!store) return; // journey not mounted yet — keep trying

      // the truck's smoothed position — the scene damps store.u; when reduced
      // the ScrollTrigger is disabled so derive u from the real scroll instead.
      const u = reduced ? journeyProgress(scrollProgress()) : store.u;

      const speed = Math.abs(store.velocity) * 150; // scene velocity → km/h-ish
      smoothSpeed.current = THREE.MathUtils.lerp(smoothSpeed.current, speed, 1 - Math.exp(-6 * dt));

      if (speedEl.current) speedEl.current.textContent = String(Math.round(smoothSpeed.current)).padStart(3, '0');

      // ETA: remaining transit time, nudged by how fast we're moving
      const remaining = Math.max(0, 1 - u);
      const pace = THREE.MathUtils.clamp(1 - smoothSpeed.current / 120, 0.55, 1.25);
      const mins = remaining * TOTAL_HOURS * 60 * pace;
      if (etaEl.current) etaEl.current.textContent = `${pad(mins / 60)}:${pad(mins % 60)}`;

      // coordinates along the geographic route
      ROUTE.getPoint(u, v);
      if (latEl.current) latEl.current.textContent = v.x.toFixed(4);
      if (lonEl.current) lonEl.current.textContent = v.y.toFixed(4);

      // leg + status (write only on change)
      const leg = currentLeg(u);
      const legStr = leg.from + ' → ' + leg.to;
      if (legEl.current && legEl.current.textContent !== legStr) legEl.current.textContent = legStr;
      if (statusEl.current && statusEl.current.textContent !== leg.status) statusEl.current.textContent = leg.status;

      // progress bar
      if (barEl.current) barEl.current.style.width = (u * 100).toFixed(1) + '%';

      // card visibility: alive while the truck moves, dim when idle
      // (only write on change so the CSS opacity transition can animate)
      const card = cardRef.current;
      if (card) {
        const active = !reduced && speed > 3 && u > 0.001 && u < 0.999;
        const next = active ? '1' : '0.55';
        if (card.dataset.state !== next) {
          card.dataset.state = next;
          card.style.opacity = next;
        }
      }
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduced, storeRef]);

  return (
    <div ref={cardRef} className="jhud" aria-hidden="true">
      <div className="jhud__head">
        <span className="jhud__rec"><i /> REC</span>
        <span className="jhud__cam">CAM 01 · TPC-TRK</span>
      </div>

      <div className="jhud__row jhud__row--leg">
        <span className="jhud__label">LEG</span>
        <span ref={legEl} className="jhud__value jhud__value--leg">IKEJA → LAGOS</span>
      </div>

      <div className="jhud__grid">
        <div className="jhud__cell">
          <span className="jhud__label">SPD</span>
          <span className="jhud__value jhud__value--mono"><b ref={speedEl}>000</b> km/h</span>
        </div>
        <div className="jhud__cell">
          <span className="jhud__label">ETA</span>
          <span className="jhud__value jhud__value--mono"><b ref={etaEl}>00:00</b> hh:mm</span>
        </div>
      </div>

      <div className="jhud__row">
        <span className="jhud__label">POS</span>
        <span className="jhud__value jhud__value--mono">
          <b ref={latEl}>06.5962</b>°N&nbsp;·&nbsp;<b ref={lonEl}>03.3376</b>°E
        </span>
      </div>

      <div className="jhud__row jhud__row--status">
        <span className="jhud__label">STS</span>
        <span ref={statusEl} className="jhud__status">DEPARTURE</span>
      </div>

      <div className="jhud__bar"><div ref={barEl} className="jhud__bar-fill" style={{ width: '0%' }} /></div>
    </div>
  );
}
