// Headless behavioral test for client/src/lib/journey.js.
// Run: node src/lib/journey.test.mjs  (from client/)
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  JOURNEY_CURVE, JOURNEY_STOPS, journeyProgress, labelOpacity, damp
} from '../src/lib/journey.js';

let passed = 0;
const ok = (name) => { passed++; console.log(`  PASS ${name}`); };

console.log('journey.test — path geometry');
// Endpoints are exact; interior waypoints are passed through by the spline
// (arc-length parameterization, so not at exact u=0.5). The curve must stay
// inside the waypoint bounding box and have a well-defined tangent everywhere.
{
  const p0 = JOURNEY_CURVE.getPointAt(0);
  const p2 = JOURNEY_CURVE.getPointAt(1);
  assert.ok(Math.abs(p0.x + 6.5) < 1e-4 && Math.abs(p0.z - 5) < 1e-4, `P0 mismatch ${p0.toArray()}`);
  assert.ok(Math.abs(p2.x - 6.5) < 1e-4 && Math.abs(p2.z + 6.2) < 1e-4, `P2 mismatch ${p2.toArray()}`);
  const { min, max } = new THREE.Box3().setFromPoints(
    [0, 0.05, 0.1, 0.25, 0.5, 0.75, 0.95, 1].map((t) => JOURNEY_CURVE.getPointAt(t))
  );
  assert.ok(min.x >= -6.5 - 1e-3 && max.x <= 6.5 + 1e-3, `x bounds ${min.x}..${max.x}`);
  assert.ok(min.z >= -6.2 - 1e-3 && max.z <= 5 + 1e-3, `z bounds ${min.z}..${max.z}`);
  assert.ok(min.y >= 0.34 - 1e-3 && max.y <= 4.8 + 1e-3, `y bounds ${min.y}..${max.y}`);
  for (const t of [0, 0.13, 0.3, 0.5, 0.7, 0.9, 1]) {
    const tan = JOURNEY_CURVE.getTangentAt(t);
    const len = tan.length();
    assert.ok(len > 1e-4 && Math.abs(len - 1) < 1e-3, `tangent not unit at t=${t}: ${len}`);
  }
  ok('curve anchored at endpoints, within waypoint bounds, unit tangents everywhere');
}

console.log('journey.test — stops exist at the promised scroll percentages');
{
  const stops = new Map(JOURNEY_STOPS.map((s) => [s.label, s.u]));
  assert.equal(stops.get('PICK UP'), 0.22);
  assert.equal(stops.get('IN TRANSIT'), 0.55);
  assert.equal(stops.get('DELIVERED'), 1);
  // scroll 25% → plateau at PICK UP; 50% → plateau at IN TRANSIT; 100% → DELIVERED
  assert.equal(journeyProgress(0.25), 0.22, 'scroll 25% must sit on the PICK UP plateau');
  assert.equal(journeyProgress(0.50), 0.55, 'scroll 50% must sit on the IN TRANSIT plateau');
  assert.equal(journeyProgress(1.00), 1.00, 'scroll 100% must reach DELIVERED');
  // plateaus span the scroll window in which the truck must pause
  assert.equal(journeyProgress(0.22), 0.22);
  assert.equal(journeyProgress(0.28), 0.22, 'still paused at PICK UP (t=0.28)');
  assert.equal(journeyProgress(0.47), 0.55, 'still paused at IN TRANSIT (t=0.47)');
  assert.equal(journeyProgress(0.53), 0.55);
  ok('stops sit on plateaus at scroll 25 / 50 / 100%');
}

console.log('journey.test — continuity (no teleports at segment seams)');
{
  // progress must be continuous: left and right limits meet at every seam
  const seams = [0.21, 0.29, 0.46, 0.54];
  for (const s of seams) {
    const lo = journeyProgress(s - 1e-6);
    const hi = journeyProgress(s + 1e-6);
    assert.ok(Math.abs(lo - hi) < 1e-3, `seam @ ${s}: ${lo} vs ${hi}`);
  }
  ok('journeyProgress continuous across all 4 segment seams');
}

console.log('journey.test — monotonic progress, bounds, clamping');
{
  let prev = -1;
  for (let t = 0; t <= 1.0001; t += 0.002) {
    const u = journeyProgress(t);
    assert.ok(u >= prev - 1e-9, `non-monotonic at t=${t}: ${prev} -> ${u}`);
    assert.ok(u >= 0 && u <= 1, `out of range at t=${t}: ${u}`);
    prev = u;
  }
  assert.equal(journeyProgress(-5), 0, 'clamps below 0');
  assert.equal(journeyProgress(7), 1, 'clamps above 1');
  ok('monotonic, bounded, clamps');
}

console.log('journey.test — labelOpacity behavior');
{
  const pickup = 0.22, transit = 0.55, delivered = 1;
  // full opacity on each plateau
  assert.equal(labelOpacity(pickup, pickup), 1);
  assert.equal(labelOpacity(transit, transit), 1);
  assert.equal(labelOpacity(delivered, delivered), 1);
  // fading out away from a stop (halo = 0.07 beyond the 0.034 plateau)
  const far = labelOpacity(0.28, pickup); // 0.06 beyond the stop → inside halo
  assert.ok(far > 0 && far < 1, `should be mid-fade at u=0.28 for PICK UP, got ${far}`);
  const gone = labelOpacity(0.4, pickup); // 0.18 beyond → fully faded
  assert.equal(gone, 0, 'fully faded well outside the halo');
  assert.equal(labelOpacity(0, 0.55), 0, 'IN TRANSIT hidden at journey start');
  // symmetry: same distance either side of a stop
  const a = labelOpacity(0.3, 0.22);
  const b = labelOpacity(0.14, 0.22);
  assert.ok(Math.abs(a - b) < 1e-9, 'opacity symmetric around stop');
  ok('label opacity peaks on plateaus, fades to 0 elsewhere');
}

console.log('journey.test — damp converges without overshoot');
{
  let v = 0;
  for (let i = 0; i < 200; i++) v = damp(v, 1, 7, 0.016);
  assert.ok(Math.abs(v - 1) < 1e-3, `damp did not converge: ${v}`);
  let w = 1;
  for (let i = 0; i < 200; i++) w = damp(w, 0, 7, 0.016);
  assert.ok(Math.abs(w) < 1e-3, `damp did not decay: ${w}`);
  assert.ok(damp(0.5, 1, 7, 0.016) < 1, 'never overshoots past target');
  ok('damp converges, never overshoots, is frame-rate independent');
}

console.log(`journey.test — ALL ${passed} PASSED`);
