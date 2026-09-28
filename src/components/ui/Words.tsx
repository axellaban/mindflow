import { type Variants, motion, useReducedMotion } from 'motion/react';
import { Fragment, useMemo } from 'react';
import { EASE } from '@/lib/motion';

/** Time between one word and the next. */
const STEP = 0.07;

/**
 * A title that arrives word by word, each one rising gently into place, the way a phrase is read.
 * The spaces stay as text, so screen readers hear the whole phrase at once.
 */
export function Words({ text, delay = 0 }: { text: string; delay?: number }) {
  const reduced = useReducedMotion();
  const variants = useMemo<Variants>(
    () => ({
      hidden: { opacity: 0, y: '0.3em' },
      show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: delay + i * STEP, duration: 0.8, ease: EASE } }),
    }),
    [delay],
  );
  if (reduced) return <span>{text}</span>;
  return (
    <motion.span initial="hidden" animate="show">
      {text.split(' ').map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <motion.span custom={i} variants={variants} className="inline-block max-w-full [overflow-wrap:anywhere]">
            {word}
          </motion.span>
        </Fragment>
      ))}
    </motion.span>
  );
}
