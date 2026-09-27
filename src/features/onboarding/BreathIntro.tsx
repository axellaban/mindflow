import { AnimatePresence, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ELI } from '@/content/eli';
import { BreathCircle } from '@/features/breathe/BreathCircle';
import { EASE } from '@/lib/motion';

const INHALE = 4;
const EXHALE = 6;
/** Breaths before moving on by itself. */
const BREATHS = 2;
const EMPTY = 0.62;

/**
 * The very first screen: two slow breaths, nothing else. Over the living beach, the breathing
 * circle grows with each inhale and settles with each exhale while a small light travels its ring.
 * Tapping anywhere (or Enter/Space) continues sooner. With reduced motion the circle keeps its
 * size and the rhythm is carried by the words and the light on the ring.
 */
export function BreathIntro({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [breaths, setBreaths] = useState(0);
  const scale = useMotionValue(reduced ? 0.86 : EMPTY);
  const turn = useMotionValue(0);

  useEffect(() => {
    // warm up the photo shown a few screens later
    new Image().src = ELI.photo;
  }, []);

  // each phase grows or settles the circle and carries the light along its ring
  useEffect(() => {
    const seconds = phase === 'in' ? INHALE : EXHALE;
    const cycle = INHALE + EXHALE;
    const fromTurn = phase === 'in' ? 0 : INHALE / cycle;
    const fromScale = scale.get();
    const toScale = phase === 'in' ? 1 : EMPTY;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / (seconds * 1000));
      turn.set(fromTurn + (k * seconds) / cycle);
      if (!reduced) scale.set(fromScale + (toScale - fromScale) * (0.5 - 0.5 * Math.cos(Math.PI * k)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const t = setTimeout(() => {
      if (phase === 'in') setPhase('out');
      else if (breaths + 1 >= BREATHS) onDone();
      else {
        setPhase('in');
        setBreaths(breaths + 1);
      }
    }, seconds * 1000);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [phase, breaths, onDone, reduced, scale, turn]);

  const word = phase === 'in' ? 'inhalá' : 'exhalá';

  return (
    // no aria-label: the button is named by what it shows ("inhalá", "Tocá para continuar")
    <motion.button
      type="button"
      autoFocus
      onClick={onDone}
      className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center outline-none focus-visible:outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.1, ease: EASE } }}
      transition={{ duration: 1.6, ease: EASE }}
    >
      <BreathCircle scale={scale} turn={turn} marks={[0, INHALE / (INHALE + EXHALE)]}>
        {/* the words cross-fade in place, so the circle is never empty */}
        <AnimatePresence initial={false}>
          <motion.span
            key={word}
            className="col-start-1 row-start-1 text-[clamp(26px,8.6vw,34px)] font-light tracking-[0.02em] text-white [text-shadow:0_1px_14px_rgb(2_38_48/0.35)]"
            initial={{ opacity: 0, filter: 'blur(6px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            {word}
          </motion.span>
        </AnimatePresence>
      </BreathCircle>

      {/* always in the button's name; it only fades into view after the first breath */}
      <motion.span
        className="pointer-events-none absolute inset-x-0 bottom-[calc(max(20px,var(--safe-bottom))+20px)] text-center text-[13px] tracking-[0.04em] text-mist-50/75"
        initial={{ opacity: 0 }}
        animate={{ opacity: breaths >= 1 ? 1 : 0 }}
        transition={{ duration: 2 }}
      >
        <span className="pointer-fine:hidden">Tocá</span>
        <span className="hidden pointer-fine:inline">Hacé clic</span> para continuar
      </motion.span>
    </motion.button>
  );
}
