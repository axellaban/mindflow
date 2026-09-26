/**
 * One motion language for the whole app: things arrive slowly and settle
 * softly, nothing bounces, and anything that idles moves at the pace of a
 * calm breath (4 s in, 6 s out).
 */

/** Arrivals: quick start, long soft landing. */
export const EASE = [0.22, 1, 0.36, 1] as const;
/** Symmetric moves (loaders, crossings). */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
/** Idle loops that breathe. */
export const EASE_BREATH = [0.45, 0, 0.55, 1] as const;

// Springs are tuned to be (almost) critically damped: they settle without overshooting.
/** Big surfaces: sheets, the mini player. */
export const SPRING_SOFT = { type: 'spring', stiffness: 190, damping: 28 } as const;
/** Indicators that glide between positions (tabs, segmented controls). */
export const SPRING_GLIDE = { type: 'spring', stiffness: 260, damping: 32 } as const;
/** Press feedback on buttons, cards and chips. */
export const SPRING_PRESS = { type: 'spring', stiffness: 420, damping: 38 } as const;

/** Gentle press: a small give under the finger, no rebound. */
export const press = { whileTap: { scale: 0.97 }, transition: SPRING_PRESS };

/** One breath, 4 s in and 6 s out, for halos and glows. Use with keyframes [rest, full, rest]. */
export const breath = { duration: 10, times: [0, 0.4, 1], repeat: Infinity, ease: EASE_BREATH };

/** Content that fades up into place. */
export const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};

/** Text that also comes into focus. Only for small elements: blurring large areas is costly on phones. */
export const revealFocus = {
  hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease: EASE } },
};

/** Parent for `reveal` children. */
export function stagger(step = 0.08, delay = 0.1) {
  return { hidden: {}, show: { transition: { staggerChildren: step, delayChildren: delay } } };
}
