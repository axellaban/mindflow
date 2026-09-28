import { useInView, useReducedMotion } from 'motion/react';
import { type RefObject, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const notifyVisibility = () => listeners.forEach((listener) => listener());
const isVisible = () => !document.hidden;
const serverVisible = () => true;

function subscribeVisibility(listener: () => void) {
  if (!listeners.size) document.addEventListener('visibilitychange', notifyVisibility);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) document.removeEventListener('visibilitychange', notifyVisibility);
  };
}

/** One visibility listener for the catalogue; clipped carousel items also stop animating. */
export function useArtworkActivity(ref: RefObject<HTMLDivElement | null>, paused = false) {
  const inView = useInView(ref, { amount: 0.05 });
  const reduced = useReducedMotion();
  const visible = useSyncExternalStore(subscribeVisibility, isVisible, serverVisible);
  return { active: inView && visible && !reduced && !paused, inView };
}
