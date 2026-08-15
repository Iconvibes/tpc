import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { JOURNEY_CURVE, damp } from '../../lib/journey.js';

const LANE_SAMPLES = 160;

/** Samples JOURNEY_CURVE from u0→u1 into a dash-ready LineGeometry. */
function makeLaneGeometry(u0, u1) {
  const n = Math.max(8, Math.round(LANE_SAMPLES * (u1 - u0)) + 1);
  const positions = new Float32Array(n * 3);
  const pt = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    JOURNEY_CURVE.getPointAt(u0 + (u1 - u0) * (i / (n - 1)), pt);
    positions[i * 3] = pt.x;
    positions[i * 3 + 1] = pt.y + 0.045; // just above the road surface
    positions[i * 3 + 2] = pt.z;
  }
  const geo = new LineGeometry();
  geo.setPositions(positions);
  return geo;
}

/**
 * The full route as a soft dashed lane. The dashes march along the path
 * (additive glow) so the road reads as alive.
 */
export function PathLane({ reduced }) {
  const matRef = useRef();
  const { size } = useThree();

  const geometry = useMemo(() => makeLaneGeometry(0, 1), []);
  const material = useMemo(
    () =>
      new LineMaterial({
        color: '#FFB800',
        transparent: true,
        opacity: 0.4,
        linewidth: 1.6,
        dashed: true,
        dashSize: 0.55,
        gapSize: 0.5,
        alphaToCoverage: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }),
    []
  );

  // computeLineDistances lives on the Line2 OBJECT (populates the per-vertex
  // instanceDistance attributes the dashed shader needs).
  const line = useMemo(() => {
    const l = new Line2(geometry, material);
    l.frustumCulled = false;
    l.computeLineDistances();
    return l;
  }, [geometry, material]);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  useFrame((state) => {
    const mat = matRef.current?.material;
    if (!mat) return;
    mat.resolution.set(size.width, size.height);
    if (!reduced) mat.dashOffset = (state.clock.elapsedTime * 0.14) % 1;
  });

  return <primitive object={line} ref={matRef} />;
}

const TRAIL_MAX = LANE_SAMPLES + 1; // preallocated once; never needs to grow

/**
 * The traveled portion of the route — a bright solid line extending from the
 * start of the path to the truck. Preallocated at max length; each frame the
 * pair-interleaved instance buffer is mutated in place (no allocation while
 * scrolling) and the unused tail is collapsed so the line ends at the truck.
 */
export function ProgressTrail({ store, reduced }) {
  const matRef = useRef();
  const { size } = useThree();
  const lastU = useRef(0);
  const lastN = useRef(0);

  const geometry = useMemo(() => {
    const n = TRAIL_MAX;
    const positions = new Float32Array(n * 3);
    const pt = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      JOURNEY_CURVE.getPointAt(i / (n - 1), pt);
      positions[i * 3] = pt.x;
      positions[i * 3 + 1] = pt.y + 0.06;
      positions[i * 3 + 2] = pt.z;
    }
    const g = new LineGeometry();
    g.setPositions(positions);
    return g;
  }, []);
  const material = useMemo(
    () =>
      new LineMaterial({
        color: '#FFD460',
        transparent: true,
        opacity: 0.85,
        linewidth: 2.6,
        alphaToCoverage: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }),
    []
  );
  const line = useMemo(() => {
    const l = new Line2(geometry, material);
    l.frustumCulled = false;
    return l;
  }, [geometry, material]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

  useFrame((_, dt) => {
    const mat = matRef.current?.material;
    if (!mat) return;
    mat.resolution.set(size.width, size.height);

    const targetU = reduced ? 0 : store.u;
    const u = damp(lastU.current, targetU, 5, dt);
    const n = Math.max(4, Math.round(TRAIL_MAX * u));
    if (Math.abs(u - lastU.current) < 0.001 && n === lastN.current) return;

    // in-place update of the pair-interleaved instance buffer
    const attrs = geometry.attributes;
    const buf = attrs.instanceStart.data.array;
    const pt = new THREE.Vector3();
    let p = 0;
    for (let i = 0; i < n; i++) {
      JOURNEY_CURVE.getPointAt(u * (i / (n - 1)), pt);
      buf[p] = pt.x; buf[p + 1] = pt.y + 0.06; buf[p + 2] = pt.z;
      if (i < n - 1) {
        JOURNEY_CURVE.getPointAt(u * ((i + 1) / (n - 1)), pt);
        buf[p + 3] = pt.x; buf[p + 4] = pt.y + 0.06; buf[p + 5] = pt.z;
      }
      p += 6;
    }
    // collapse the remaining tail to the last point so the trail ends at the truck
    for (let i = n - 1; i < TRAIL_MAX - 1; i++) {
      buf[p] = buf[p + 3] = buf[p - 3];
      buf[p + 1] = buf[p + 4] = buf[p - 2];
      buf[p + 2] = buf[p + 5] = buf[p - 1];
      p += 6;
    }
    attrs.instanceStart.needsUpdate = true;
    attrs.instanceEnd.needsUpdate = true;

    lastU.current = u;
    lastN.current = n;
  });

  return <primitive object={line} ref={matRef} />;
}
