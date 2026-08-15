import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from '../../lib/gsap.js';
import JourneyScene from './JourneyScene.jsx';

function detectEnv() {
  return {
    mobile: window.matchMedia('(max-width: 768px)').matches,
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
}

/**
 * Journey3D — the hero's "Delivery Journey". A fixed, transparent
 * three.js canvas behind the entire page: the truck drives along a
 * curved path as you scroll, camera trailing behind it, with paused
 * stops at PICK UP / IN TRANSIT / DELIVERED. Never intercepts input.
 */
export default function Journey3D({ storeRef }) {
  const wrapRef = useRef(null);
  const store = useRef({ progress: 0, u: 0, velocity: 0 }).current;
  const [env, setEnv] = useState(detectEnv);

  // share the store up so the HUD overlay (outside the z:-1 journey layer)
  // can read the same live values
  useEffect(() => {
    if (storeRef) storeRef.current = store;
  }, [storeRef, store]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setEnv({ mobile: mq.matches, reduced: rm.matches });
    mq.addEventListener?.('change', onChange);
    rm.addEventListener?.('change', onChange);
    return () => {
      mq.removeEventListener?.('change', onChange);
      rm.removeEventListener?.('change', onChange);
    };
  }, []);

  useGSAP(() => {
    if (env.reduced) return;
    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        store.progress = self.progress;
      }
    });
    return () => st.kill();
  }, { scope: wrapRef, dependencies: [env.reduced] });

  return (
    <div ref={wrapRef} className="journey" aria-hidden="true">
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 130, position: [-6.5, 3.4, 10] }}
        dpr={env.mobile ? [1, 1.5] : [1, 2]}
        gl={{
          alpha: true,
          antialias: !env.mobile,
          preserveDrawingBuffer: !env.mobile,
          powerPreference: 'high-performance'
        }}
        onCreated={({ gl }) => gl.setClearColor('#0A0A0A', 0)}
        performance={{ min: 0.5 }}
        style={{ pointerEvents: 'none' }}
      >
        <JourneyScene store={store} env={env} />
      </Canvas>
    </div>
  );
}
