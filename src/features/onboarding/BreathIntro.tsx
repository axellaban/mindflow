import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { ELI } from '@/content/eli';
import { EASE, EASE_BREATH } from '@/lib/motion';

const INHALE = 4;
const EXHALE = 6;
/** Breaths before moving on by itself. */
const BREATHS = 2;

/**
 * The very first screen: two slow breaths, nothing else. The scene behind it
 * keeps moving and a soft light grows and fades with each breath. Tapping
 * anywhere (or Enter/Space) continues sooner. With reduced motion the same
 * rhythm stays, carried by light and words only: the light brightens and dims without growing.
 */
export function BreathIntro({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const [breaths, setBreaths] = useState(0);

  useEffect(() => {
    // warm up the photo shown a few screens later
    new Image().src = ELI.photo;
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (phase === 'in') setPhase('out');
        else if (breaths + 1 >= BREATHS) onDone();
        else {
          setPhase('in');
          setBreaths(breaths + 1);
        }
      },
      (phase === 'in' ? INHALE : EXHALE) * 1000,
    );
    return () => clearTimeout(t);
  }, [phase, breaths, onDone]);

  const word = phase === 'in' ? 'Inhalá…' : 'Exhalá…';

  return (
    // no aria-label: the button is named by what it shows ("Inhalá…", "Tocá para continuar")
    <motion.button
      type="button"
      autoFocus
      onClick={onDone}
      className="absolute inset-0 z-20 cursor-pointer outline-none focus-visible:outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.1, ease: EASE } }}
      transition={{ duration: 1.6, ease: EASE }}
    >
      {/* light that breathes with the words, centered on the sun */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute top-[28%] left-1/2 size-[min(118vmin,880px)] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
        style={{ background: 'radial-gradient(closest-side, rgb(255 244 220 / 0.55), rgb(255 238 205 / 0.16) 45%, transparent 72%)' }}
        initial={{ scale: reduced ? 1 : 0.82, opacity: 0.35 }}
        animate={phase === 'in' ? { scale: reduced ? 1 : 1.1, opacity: 0.85 } : { scale: reduced ? 1 : 0.82, opacity: 0.35 }}
        transition={{ duration: phase === 'in' ? INHALE : EXHALE, ease: EASE_BREATH }}
      />

      <span className="pointer-events-none absolute inset-x-0 top-[52%] flex -translate-y-1/2 justify-center">
        <AnimatePresence initial={false}>
          <motion.span
            key={word}
            className="absolute font-display text-[44px] leading-none tracking-[-0.01em] text-mist-50 [text-shadow:0_2px_28px_rgb(0_0_0/0.28)] md:text-[56px]"
            initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(8px)' }}
            transition={{ duration: 1.5, ease: EASE }}
          >
            {word}
          </motion.span>
        </AnimatePresence>
      </span>

      {/* always in the button's name; it only fades into view after the first breath */}
      <motion.span
        className="pointer-events-none absolute inset-x-0 bottom-[calc(max(20px,var(--safe-bottom))+20px)] text-center text-[13px] tracking-[0.04em] text-mist-50/60"
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
