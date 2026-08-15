import { motion, useReducedMotion } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

/**
 * Reveal — scroll-triggered entrance (fade + rise + de-blur).
 * Same API as before (children, delay, className) so every existing
 * call site keeps working, now powered by Framer Motion.
 */
export default function Reveal({ children, delay = 0, className = '', y = 32 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`reveal ${className}`}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-8% 0px -8% 0px' }}
      transition={{ duration: reduce ? 0 : 0.85, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
