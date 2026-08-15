import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, Grid } from '@react-three/drei';
import {
  JOURNEY_CURVE, JOURNEY_STOPS, journeyProgress, labelOpacity, scrollProgress, damp
} from '../../lib/journey.js';
import { JourneyTruck } from './Truck.jsx';
import { PathLane, ProgressTrail } from './PathLane.jsx';
import CityTags from './CityTags.jsx';

const FWD = new THREE.Vector3(0, 0, 1);
const THREE_CLAMP = THREE.MathUtils.clamp;

/* --------------------------- motion streak --------------------------- */

function MotionStreak({ store, reduced }) {
  const mesh = useRef();
  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const target = THREE_CLAMP(Math.abs(store.velocity) * 0.85, 0, 1);
    m.scale.z = damp(m.scale.z, 1 + target * 2.4, 7, dt);
    m.material.opacity = damp(m.material.opacity, target * 0.26, 8, dt);
  });
  if (reduced) return null;
  return (
    <mesh ref={mesh} position={[0, 0.95, -2.7]}>
      <boxGeometry args={[0.55, 0.3, 1.2]} />
      <meshBasicMaterial color="#FFB800" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ------------------------------ dust ------------------------------ */

function Dust({ store, groupRef, count, reduced }) {
  const points = useRef();
  const data = useMemo(() => ({
    pos: new Float32Array(count * 3),
    vel: new Float32Array(count * 3),
    life: new Float32Array(count),
    cursor: 0
  }), [count]);
  const spawn = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const pts = points.current;
    if (!pts || reduced) return;
    const speed = Math.abs(store.velocity);
    const d = data;

    // puff dust from the rear wheels while moving
    if (speed > 0.18 && Math.random() < Math.min(0.55, speed * 2.4)) {
      for (let k = 0; k < 2; k++) {
        const i = d.cursor;
        d.cursor = (d.cursor + 1) % count;
        spawn.set(
          -0.62 + Math.random() * 1.2,
          0.2 + Math.random() * 0.12,
          -1.55 - Math.random() * 0.35
        );
        groupRef.current.localToWorld(spawn);
        d.pos[i * 3] = spawn.x + (Math.random() - 0.5) * 0.12;
        d.pos[i * 3 + 1] = spawn.y;
        d.pos[i * 3 + 2] = spawn.z + (Math.random() - 0.5) * 0.12;
        d.vel[i * 3] = (Math.random() - 0.5) * 1.5;
        d.vel[i * 3 + 1] = 0.7 + Math.random() * 1.2;
        d.vel[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
        d.life[i] = 1;
      }
    }

    const dtc = Math.min(dt, 0.05);
    for (let i = 0; i < count; i++) {
      if (d.life[i] <= 0) continue;
      d.life[i] -= dtc * 0.85;
      d.vel[i * 3 + 1] -= 3.6 * dtc;
      d.pos[i * 3] += d.vel[i * 3] * dtc;
      d.pos[i * 3 + 1] += d.vel[i * 3 + 1] * dtc;
      d.pos[i * 3 + 2] += d.vel[i * 3 + 2] * dtc;
      if (d.pos[i * 3 + 1] < 0.02) d.life[i] = 0;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#FFB800"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------------------------- stop labels ---------------------------- */

function StopLabel({ store, stop, reduced }) {
  const ref = useRef();
  const pos = useMemo(() => {
    const p = JOURNEY_CURVE.getPointAt(stop.u);
    p.y += 2.0;
    return p;
  }, [stop]);

  useFrame((state) => {
    const el = ref.current;
    if (!el) return;
    // reduced motion: no truck, no camera — labels still mark the stops.
    const u = reduced ? journeyProgress(scrollProgress()) : store.u;
    const o = labelOpacity(u, stop.u);
    el.style.opacity = o.toFixed(3);
    el.style.transform = reduced
      ? ''
      : `translateY(${Math.round(Math.sin(state.clock.elapsedTime * 1.7 + stop.u * 9) * 4)}px)`;
  });

  return (
    <Html
      position={pos}
      center
      transform
      sprite
      distanceFactor={9}
      zIndexRange={[350, 0]}
      wrapperClass="j3d-label-wrap"
    >
      <div ref={ref} className="j3d-label" style={{ opacity: 0 }}>
        <span className="j3d-label__kicker">{stop.u === 1 ? 'FINAL STOP' : 'STOP'}</span>
        <b>{stop.label}</b>
        <em>{stop.sub}</em>
      </div>
    </Html>
  );
}

/* ------------------------------ scene ------------------------------ */

export default function JourneyScene({ store, env }) {
  const truckRef = useRef();
  const camPos = useRef(new THREE.Vector3());
  const prevU = useRef(0);

  useFrame((state, dt) => {
    if (env.reduced) return; // frozen scene; labels drive off scroll in StopLabel
    const target = journeyProgress(store.progress);
    store.u = damp(store.u, target, 7, dt);
    store.velocity = (store.u - prevU.current) / Math.max(dt, 1e-4);
    prevU.current = store.u;

    const pos = JOURNEY_CURVE.getPointAt(store.u);
    const tan = JOURNEY_CURVE.getTangentAt(store.u);
    if (truckRef.current) {
      truckRef.current.position.copy(pos);
      truckRef.current.quaternion.setFromUnitVectors(FWD, tan);
    }

    // camera trails behind the truck with a slight upward offset
    const behind = pos.clone().addScaledVector(tan, -6.8);
    behind.y += 2.5;
    if (camPos.current.lengthSq() === 0) camPos.current.copy(behind);
    camPos.current.lerp(behind, 1 - Math.exp(-3.2 * dt));
    state.camera.position.copy(camPos.current);
    const look = pos.clone().addScaledVector(tan, 2);
    look.y += 0.7;
    state.camera.lookAt(look);
  });

  return (
    <>
      <fog attach="fog" args={['#0A0A0A', 15, 46]} />
      <ambientLight intensity={env.mobile ? 0.6 : 0.7} />
      <directionalLight position={[10, 14, 8]} intensity={env.mobile ? 1.15 : 1.4} />

      {/* subtle ground grid */}
      <Grid
        position={[0, -0.01, 0]}
        args={[10, 10]}
        cellSize={0.9}
        cellThickness={0.6}
        cellColor="#1D1D1D"
        sectionSize={4.5}
        sectionThickness={1.1}
        sectionColor="#4A3600"
        fadeDistance={44}
        fadeStrength={2.2}
        infiniteGrid
        followCamera={false}
      />

      {/* the route: dashed lane + bright traveled trail */}
      <PathLane reduced={env.reduced} />
      <ProgressTrail store={store} reduced={env.reduced} />

      {/* truck unit: GLTF model (procedural fallback while it loads/fails) */}
      <group ref={truckRef}>
        <JourneyTruck store={store} reduced={env.reduced} />
        <MotionStreak store={store} reduced={env.reduced} />
        <Dust store={store} groupRef={truckRef} count={env.mobile ? 60 : 140} reduced={env.reduced} />
      </group>

      <CityTags store={store} reduced={env.reduced} />

      {JOURNEY_STOPS.map((stop) => (
        <StopLabel key={stop.key} store={store} stop={stop} reduced={env.reduced} />
      ))}
    </>
  );
}
