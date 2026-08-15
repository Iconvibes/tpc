import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { JOURNEY_CURVE, JOURNEY_CITIES, labelOpacity } from '../../lib/journey.js';

/**
 * CityTags — the "live route map" layer. Each city on the path gets a
 * glowing waypoint dot on the road and a floating 3D name tag beside it
 * (IKEJA → LAGOS → LHR). Dots pulse; the current destination pulses
 * brighter. The tags stay visible for the whole journey, like a map.
 */

function CityDot({ city, store, reduced }) {
  const core = useRef();
  const glow = useRef();

  const pos = useMemo(() => {
    const p = JOURNEY_CURVE.getPointAt(city.u);
    p.y += 0.02;
    return p;
  }, [city]);

  useFrame((state) => {
    if (reduced) {
      core.current?.scale.setScalar(1);
      return;
    }
    const t = state.clock.elapsedTime;
    const near = labelOpacity(store.u, city.u); // 1 when the truck is here
    const pulse = 0.75 + Math.sin(t * 2.4 + city.u * 13) * 0.25;
    const s = (0.9 + near * 0.55) * pulse;
    core.current?.scale.setScalar(s);
    const mat = glow.current?.material;
    if (mat) mat.opacity = 0.28 + near * 0.55 + Math.sin(t * 2.4 + city.u * 13) * 0.08;
  });

  return (
    <group position={pos}>
      <mesh ref={glow}>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshBasicMaterial
          color="#FFB800"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshBasicMaterial color="#FFE9A8" />
      </mesh>
    </group>
  );
}

function CityTag({ city, store, reduced }) {
  const tagRef = useRef();
  const wrapRef = useRef();

  // tag sits to the side of the path, elevated — a map pin that never
  // collides with the stop label hovering over the road.
  const tagPos = useMemo(() => {
    const p = JOURNEY_CURVE.getPointAt(city.u);
    const tan = JOURNEY_CURVE.getTangentAt(city.u);
    // right-handed perpendicular to the tangent, flattened to the XZ plane
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    p.addScaledVector(side, city.right);
    p.y += 1.15;
    return p;
  }, [city]);

  // the pulsing dot sits ON the road at the city's position
  const dotPos = useMemo(() => {
    const p = JOURNEY_CURVE.getPointAt(city.u);
    p.y += 0.02;
    return p;
  }, [city]);

  // thin connector from the road to the tag, like a leader line
  const connector = useMemo(() => {
    const from = JOURNEY_CURVE.getPointAt(city.u);
    from.y += 0.05;
    const to = from.clone();
    const tan = JOURNEY_CURVE.getTangentAt(city.u);
    to.addScaledVector(new THREE.Vector3(-tan.z, 0, tan.x).normalize(), city.right);
    to.y += 1.05;
    return [from, to];
  }, [city]);

  const points = useMemo(
    () => Float32Array.from(connector.flatMap((v) => [v.x, v.y, v.z])),
    [connector]
  );

  useFrame(() => {
    const el = tagRef.current;
    if (!el) return;
    // subtle idle drift; no opacity gating — the map is always readable
    el.style.transform = reduced
      ? ''
      : `translateY(${Math.round(Math.sin(performance.now() / 2600 + city.u * 17) * 3)}px)`;
  });

  return (
    <>
      {/* leader line + waypoint dot at the road */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[points, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#3d3a2e" transparent opacity={0.55} />
      </line>
      <CityDot city={city} store={store} reduced={reduced} />

      {/* floating name tag */}
      <Html
        position={tagPos}
        center
        transform
        distanceFactor={11}
        zIndexRange={[40, 0]}
        wrapperClass="j3d-city-wrap"
      >
        <div ref={tagRef} className="j3d-city">
          <span className="j3d-city__code">{city.code}</span>
          <span className="j3d-city__bar" />
          <b>{city.name}</b>
          <em>{city.sub}</em>
        </div>
      </Html>
    </>
  );
}

export default function CityTags({ store, reduced }) {
  return JOURNEY_CITIES.map((city) => (
    <CityTag key={city.key} city={city} store={store} reduced={reduced} />
  ));
}
