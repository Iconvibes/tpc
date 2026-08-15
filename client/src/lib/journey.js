import * as THREE from 'three';

/**
 * The "Delivery Journey" — the scroll-controlled 3D scene math.
 *
 * Scroll progress (0..1 across the whole page) is reshaped into a
 * position along the truck's curved path (0..1). The path plateaus at
 * each stop so the truck visibly "pauses" while a floating label shows.
 */

/* The 3 waypoints the path passes through, in world space. */
const P0 = new THREE.Vector3(-6.5, 0.34, 5);
const P1 = new THREE.Vector3(0, 2.6, -0.6);
const P2 = new THREE.Vector3(6.5, 4.8, -6.2);

export const JOURNEY_CURVE = new THREE.CatmullRomCurve3([P0, P1, P2], false, 'catmullrom', 0.6);

export const JOURNEY_STOPS = [
  { key: 'pickup', label: 'PICK UP', sub: 'CARGO LOADED · IKEJA', u: 0.22 },
  { key: 'transit', label: 'IN TRANSIT', sub: 'ON THE ROAD · LIVE', u: 0.55 },
  { key: 'delivered', label: 'DELIVERED', sub: 'PROOF OF DELIVERY', u: 1 }
];

/** City waypoints along the path — the "live route map" labels. */
export const JOURNEY_CITIES = [
  { key: 'ikeja', name: 'IKEJA', sub: 'LAGOS · NIGERIA', code: 'LOS', u: 0, right: 1.9, y: 0.35 },
  { key: 'lagos', name: 'LAGOS', sub: 'LAGOS · NIGERIA', code: 'LOS', u: 0.5, right: -2.1, y: 0.35 },
  { key: 'lhr', name: 'LONDON', sub: 'UNITED KINGDOM', code: 'LHR', u: 1, right: 1.9, y: 0.35 }
];

const clamp01 = (n) => THREE.MathUtils.clamp(n, 0, 1);

/* drive → arrive at PICK UP (0→25% scroll), pause, drive → IN TRANSIT
   (≈50%), pause, drive → DELIVERED (100%). */
const SEGMENTS = [
  { a: 0.0, b: 0.21, u0: 0.0, u1: 0.22 }, // depart → arrive at PICK UP
  { a: 0.21, b: 0.29, u0: 0.22, u1: 0.22 }, // pause at PICK UP
  { a: 0.29, b: 0.46, u0: 0.22, u1: 0.55 }, // → arrive at IN TRANSIT
  { a: 0.46, b: 0.54, u0: 0.55, u1: 0.55 }, // pause at IN TRANSIT
  { a: 0.54, b: 1.0, u0: 0.55, u1: 1.0 } // → DELIVERED
];

/** Raw scroll progress (0..1) → truck position along the path (0..1). */
export function journeyProgress(t) {
  const p = clamp01(t);
  for (const s of SEGMENTS) {
    if (p <= s.b) {
      const k = (p - s.a) / Math.max(s.b - s.a, 1e-6);
      return s.u0 + (s.u1 - s.u0) * k;
    }
  }
  return 1;
}

/** 0..1 scroll progress of the whole document (window scroll, not ScrollTrigger). */
export function scrollProgress() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(window.scrollY / max, 1) : 0;
}

/** 0..1 visibility of a stop label based on where the truck is. */
export function labelOpacity(u, stopU) {
  const plateau = 0.034;
  const halo = 0.07;
  const d = Math.abs(u - stopU);
  if (d <= plateau / 2) return 1;
  return clamp01(1 - (d - plateau / 2) / halo);
}



/** Frame-rate independent exponential damping. */
export function damp(current, target, lambda, dt) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}
