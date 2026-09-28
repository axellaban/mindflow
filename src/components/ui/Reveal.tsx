import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { EASE } from '@/lib/motion';

/** Reveal each section when it reaches the viewport, including sections below the fold. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.65, ease: EASE }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
