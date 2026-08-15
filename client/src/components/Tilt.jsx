import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Tilt — 3D perspective tilt on hover. Wraps any content (service icons,
 * the live waybill, the 3D container) in a springy rotateX/rotateY field.
 */
export default function Tilt({ children, className = '', max = 12, scale = 1.02, rotate = 0 }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 18, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 180, damping: 18, mass: 0.6 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    rx.set(-py * max);
    ry.set(px * max);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt ${className}`}
      style={{
        rotateX: srx,
        rotateY: sry,
        rotate,
        transformPerspective: 900,
        transformStyle: 'preserve-3d',
        scale: 1
      }}
      whileHover={{ scale }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}
