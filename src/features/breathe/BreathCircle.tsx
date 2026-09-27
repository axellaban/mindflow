import { AnimatePresence, type MotionValue, type Variants, motion, useMotionValueEvent, useTransform } from 'motion/react';
import { type ReactNode, useId, useState } from 'react';
import { EASE, EASE_IN_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * A minimal breathing guide: a clear glass bubble that grows with each inhale and settles with
 * each exhale, and a hairline ring around it with a mark where each phase begins. A small light
 * travels the ring through the whole cycle and draws the part of the breath already taken; when
 * the breath is complete the circle closes and fades while the next one begins.
 */
export function BreathCircle({
  scale,
  turn,
  marks,
  children,
  className,
}: {
  /** Size of the bubble (about 0.56 when empty, 1 when full). */
  scale: MotionValue<number>;
  /** Position in the breathing cycle, 0 to 1. */
  turn: MotionValue<number>;
  /** Where each phase starts in the cycle, 0 to 1. */
  marks: number[];
  children?: ReactNode;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rotate = useTransform(turn, (t) => t * 360);
  // counts finished breaths: the cycle starting over means one was completed
  const [done, setDone] = useState(0);
  useMotionValueEvent(turn, 'change', (t) => {
    const before = turn.getPrevious();
    if (before !== undefined && t < before - 0.5) setDone((n) => n + 1);
  });

  return (
    <motion.div style={{ scale }} className={cn('relative aspect-square w-[min(64vw,320px)] will-change-transform', className)}>
      <div className="absolute inset-[-9%]" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="size-full overflow-visible">
          <defs>
            <linearGradient id={`${id}-arc`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#b4fff2" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="49" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="0.5" />
          <g transform="rotate(-90 50 50)">
            {/* the breath so far, from the top */}
            <motion.circle cx="50" cy="50" r="49" fill="none" stroke={`url(#${id}-arc)`} strokeOpacity="0.9" strokeWidth="1" style={{ pathLength: turn }} />
            {/* the breath just completed, closing and fading */}
            {done > 0 && (
              <motion.circle
                key={done}
                cx="50"
                cy="50"
                r="49"
                fill="none"
                stroke={`url(#${id}-arc)`}
                strokeWidth="1"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
              />
            )}
          </g>
          {marks.map((m) => {
            const a = m * Math.PI * 2 - Math.PI / 2;
            return <circle key={m} cx={50 + 49 * Math.cos(a)} cy={50 + 49 * Math.sin(a)} r="1.2" fill="#ffffff" opacity="0.9" />;
          })}
        </svg>
      </div>
      {/* the light that travels the ring */}
      <motion.div className="absolute inset-[-9%]" style={{ rotate }} aria-hidden="true">
        <span className="absolute top-[0.5%] left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_4px_rgb(255_255_255/0.55)]" />
      </motion.div>
      <Bubble className="absolute inset-0" />
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </motion.div>
  );
}

/**
 * The bubble on its own: clear glass that lets the beach through, with a bright rim and light from
 * above. When it holds a word it is a little deeper in the middle, so white text stays readable
 * over the brightest sky.
 */
export function Bubble({ className, empty }: { className?: string; empty?: boolean }) {
  return (
    <div
      className={cn('rounded-full backdrop-blur-[5px]', className)}
      style={{
        background: empty
          ? 'radial-gradient(circle, rgb(126 242 226 / 0.1) 0%, rgb(126 242 226 / 0.16) 62%, rgb(200 255 246 / 0.36) 100%)'
          : 'radial-gradient(circle, rgb(4 52 64 / 0.34) 0%, rgb(4 52 64 / 0.22) 45%, rgb(126 242 226 / 0.08) 74%, rgb(200 255 246 / 0.3) 100%)',
        boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.32), inset 0 0 34px rgb(180 255 242 / 0.26), 0 0 56px 2px rgb(126 242 226 / 0.18)',
      }}
      aria-hidden="true"
    >
      <div className="size-full rounded-full bg-[radial-gradient(52%_36%_at_32%_20%,rgb(255_255_255/0.3),transparent_72%)]" />
    </div>
  );
}

/** The end of a practice: the ring draws itself closed around the bubble. */
export function ClosedCircle({ className }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <div className={cn('relative', className)} aria-hidden="true">
      <div className="absolute inset-[-12%]">
        <svg viewBox="0 0 100 100" className="size-full overflow-visible">
          <defs>
            <linearGradient id={`${id}-arc`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#b4fff2" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="49" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.8" />
          <g transform="rotate(-90 50 50)">
            <motion.circle
              cx="50"
              cy="50"
              r="49"
              fill="none"
              stroke={`url(#${id}-arc)`}
              strokeWidth="1.6"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.6, delay: 0.4, ease: EASE_IN_OUT }}
            />
          </g>
        </svg>
      </div>
      <Bubble empty className="absolute inset-0" />
    </div>
  );
}

const WORD: Variants = {
  hidden: {},
  shown: {},
  gone: { opacity: 0, filter: 'blur(6px)', transition: { duration: 0.6, ease: EASE } },
};
const LETTER: Variants = {
  hidden: { opacity: 0, y: 5, filter: 'blur(4px)' },
  shown: (i: number) => ({ opacity: 1, y: 0, filter: 'blur(0px)', transition: { delay: i * 0.06, duration: 0.6, ease: EASE } }),
};

/**
 * The phase word. It arrives letter by letter, at an unhurried pace, and leaves as a whole while
 * the next one arrives in the same place, so the bubble is never empty. `silent` hides it from
 * screen readers when the screen announces the phases another way.
 */
export function BreathWord({ word, id = word, silent, className }: { word: string; id?: string; silent?: boolean; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      <motion.span
        key={id}
        aria-hidden={silent || undefined}
        className={cn('col-start-1 row-start-1', className)}
        variants={WORD}
        initial="hidden"
        animate="shown"
        exit="gone"
      >
        {!silent && <span className="sr-only">{word}</span>}
        <span aria-hidden="true">
          {[...word].map((ch, i) => (
            <motion.span key={i} custom={i} variants={LETTER} className="inline-block whitespace-pre">
              {ch}
            </motion.span>
          ))}
        </span>
      </motion.span>
    </AnimatePresence>
  );
}
