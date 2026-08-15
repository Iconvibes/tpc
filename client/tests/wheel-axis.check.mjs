// Verifies the milk-truck wheel orientation so wheel spin uses the right axis.
// Run: node tests/wheel-axis.check.mjs (from client/)
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { readFileSync } from 'node:fs';

// GLTFLoader's texture path checks `typeof self`; provide a minimal global in Node.
if (typeof globalThis.self === 'undefined') globalThis.self = globalThis;

const buf = readFileSync(new URL('../public/models/milk-truck.glb', import.meta.url));
// GLTFLoader expects an ArrayBuffer; Node's Buffer is a Uint8Array view
const bin = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const loader = new GLTFLoader();

loader.parse(bin, '', (gltf) => {
  const scene = gltf.scene;
  scene.updateMatrixWorld(true);
  let wheels = 0;
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const name = (o.material?.name || '');
    if (!name.toLowerCase().includes('wheel')) return;
    wheels++;
    const box = new THREE.Box3().setFromObject(o);
    const size = new THREE.Vector3();
    box.getSize(size);
    // A wheel's cylinder axis is the world axis along which it is THINNEST.
    const axes = ['x', 'y', 'z'].map((a) => ({ a, v: size[a] })).sort((p, q) => p.v - q.v);
    console.log(`wheel "${name}" size x=${size.x.toFixed(3)} y=${size.y.toFixed(3)} z=${size.z.toFixed(3)} → axle along ${axes[0].a.toUpperCase()} (thinnest)`);
  });
  console.log(`total wheel meshes: ${wheels}`);
}, (err) => {
  console.log('PARSE ERROR', err?.message);
  process.exit(1);
});
