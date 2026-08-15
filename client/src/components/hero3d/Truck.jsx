import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useProgress } from '@react-three/drei';

/**
 * Truck — the hero's delivery truck.
 *
 * Loads the low-poly Cesium Milk Truck GLB (CC-BY 4.0, Khronos glTF sample),
 * tinted to the brand yellow #FFB800 with glass and wheels kept dark.
 * While the model streams in — or if the fetch ever fails — the scene keeps
 * showing the original procedural box truck, so the journey never goes empty.
 *
 * The GLB's cab faces +Z after its Y-up→Z-up root rotation, which matches
 * the direction the journey path drives — no reorientation needed.
 *
 * Model: "Cesium Milk Truck" by Cesium, from the KhronosGroup glTF-Sample-
 * Models repository — CC-BY 4.0. https://github.com/KhronosGroup/glTF-Sample-Models
 */

const YELLOW = '#FFB800';
const MODEL_URL = '/models/milk-truck.glb';

// kick off the GLB fetch immediately so the swap is fast
useGLTF.preload(MODEL_URL);

/* ----------------------- procedural fallback truck ----------------------- */

const WHEELS = [
  [-0.62, 0.34, -1.05],
  [0.62, 0.34, -1.05],
  [-0.62, 0.34, 1.05],
  [0.62, 0.34, 1.05]
];

export function ProceduralTruck({ store, reduced }) {
  const wheels = useRef([]);
  const wheelGeo = useMemo(
    () => new THREE.CylinderGeometry(0.34, 0.34, 0.24, 16).rotateX(Math.PI / 2),
    []
  );
  const yellow = useMemo(
    () => new THREE.MeshStandardMaterial({ color: YELLOW, roughness: 0.55, metalness: 0.15, emissive: '#5a3d00', emissiveIntensity: 0.25 }),
    []
  );
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.9 }), []);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0A0A0A', roughness: 0.12, metalness: 0.6 }), []);
  const stripe = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0A0A0A', roughness: 0.7 }), []);

  useFrame((_, dt) => {
    if (reduced) return;
    const spin = Math.abs(store.velocity) * dt * 18;
    for (const w of wheels.current) if (w) w.rotation.z += spin;
  });

  return (
    <group>
      {/* chassis */}
      <mesh position={[0, 0.42, 0.1]} material={dark} castShadow>
        <boxGeometry args={[1.35, 0.2, 3.1]} />
      </mesh>
      {/* cargo container */}
      <mesh position={[0, 1.02, -0.35]} material={yellow} castShadow>
        <boxGeometry args={[1.42, 1.0, 2.5]} />
      </mesh>
      {/* container bumper stripe */}
      <mesh position={[0, 0.72, -0.35]} material={stripe}>
        <boxGeometry args={[1.46, 0.07, 2.52]} />
      </mesh>
      {/* cab */}
      <mesh position={[0, 0.95, 1.25]} material={yellow} castShadow>
        <boxGeometry args={[1.35, 0.85, 0.85]} />
      </mesh>
      {/* windshield */}
      <mesh position={[0, 1.12, 1.68]} material={glass}>
        <boxGeometry args={[1.18, 0.4, 0.06]} />
      </mesh>
      {/* wheels */}
      {WHEELS.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => { wheels.current[i] = el; }}
          geometry={wheelGeo}
          position={p}
          material={dark}
          castShadow
        />
      ))}
    </group>
  );
}

/* ----------------------------- GLTF truck ----------------------------- */

/** Lift the model so its lowest point sits exactly on the road (y = 0). */
function sitOnGround(object) {
  const box = new THREE.Box3().setFromObject(object);
  object.position.y += 0.01 - box.min.y;
}

function GltfTruck({ store, reduced }) {
  const { scene: base } = useGLTF(MODEL_URL);
  const wheelSpinners = useRef([]);

  // Clone + tint once per load. Never mutate the cached scene graph.
  const truck = useMemo(() => {
    const t = base.clone(true);
    const wheels = [];
    t.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const name = (o.material?.name || '').toLowerCase();
      if (name.includes('wheels')) {
        o.material = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.9 });
        wheels.push(o);
      } else if (name.includes('glass') || name.includes('trim')) {
        o.material = new THREE.MeshStandardMaterial({ color: '#0A0A0A', roughness: 0.15, metalness: 0.65 });
      } else {
        o.material = new THREE.MeshStandardMaterial({
          color: YELLOW, roughness: 0.5, metalness: 0.15,
          emissive: '#5a3d00', emissiveIntensity: 0.22
        });
      }
    });

    // the path world is built for a ~1.4-unit truck; this model is ~4.9 units
    t.scale.setScalar(0.28);
    t.updateMatrixWorld(true);

    // wrap each wheel in a spinner group so rotation pivots at the wheel
    wheelSpinners.current = [];
    for (const w of wheels) {
      const parent = w.parent;
      const spinner = new THREE.Group();
      const pos = w.position.clone();
      parent.add(spinner);
      spinner.position.copy(pos);
      w.position.set(0, 0, 0);
      spinner.add(w);
      wheelSpinners.current.push(spinner);
    }

    t.updateMatrixWorld(true);
    sitOnGround(t);
    return t;
  }, [base]);

  useFrame((_, dt) => {
    if (reduced) return;
    const spin = Math.abs(store.velocity) * dt * 18;
    for (const s of wheelSpinners.current) if (s) s.rotation.z += spin;
  });

  return <primitive object={truck} />;
}

/* ------------------------- load gate + fallback ------------------------- */

/**
 * Reports when the GLB has finished loading (or failed) by watching drei's
 * global useProgress store. Renders nothing.
 */
function LoadGate({ onSettled }) {
  const { active, errors } = useProgress();
  const settled = useRef(false);
  useEffect(() => {
    if (settled.current) return;
    // already cached from a previous visit? flip immediately.
    if (useGLTF.__cache?.[MODEL_URL]?.scene) {
      settled.current = true;
      onSettled?.('ready');
      return;
    }
    if (active) return; // wait for the load to finish
    if (errors?.[MODEL_URL]) {
      settled.current = true;
      onSettled?.('failed');
    } else if (useGLTF.__cache?.[MODEL_URL]?.scene) {
      settled.current = true;
      onSettled?.('ready');
    }
  }, [active, errors, onSettled]);
  return null;
}

/** If the GLB throws after being reported ready (corrupt file, parse error),
 * drop back to the procedural truck instead of leaving the journey empty. */
class LoadBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <ProceduralTruck store={this.props.store} reduced={this.props.reduced} /> : this.props.children;
  }
}

/**
 * The journey truck: GLTF model once ready, procedural build as the loading
 * (or failure) fallback. JourneyScene positions the wrapper group, so no ref
 * is needed here.
 */
export function JourneyTruck({ store, reduced }) {
  const [ready, setReady] = useState(false);
  return (
    <>
      <LoadGate onSettled={(state) => { if (state === 'ready') setReady(true); }} />
      {ready ? (
        <LoadBoundary store={store} reduced={reduced}>
          <GltfTruck store={store} reduced={reduced} />
        </LoadBoundary>
      ) : (
        <ProceduralTruck store={store} reduced={reduced} />
      )}
    </>
  );
}
