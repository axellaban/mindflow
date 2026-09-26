import { motion, useReducedMotion } from 'motion/react';
import { ELI } from '@/content/eli';
import { cn } from '@/lib/utils';

/** Eli's photo with a soft halo that breathes slowly. */
export function EliAvatar({ size = 48, halo = true, className }: { size?: number; halo?: boolean; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <span className={cn('relative inline-flex shrink-0', className)} style={{ width: size, height: size }}>
      {halo && (
        <motion.span
          aria-hidden="true"
          className="absolute -inset-1.5 rounded-full bg-[conic-gradient(from_200deg,#f7cbd6,#ffd6bd,#cfe2d5,#f0a9bd,#f7cbd6)] blur-[7px]"
          initial={{ opacity: 0.55, scale: 1 }}
          animate={reduced ? undefined : { opacity: [0.4, 0.85, 0.4], scale: [0.96, 1.08, 0.96] }}
          transition={{ duration: 6, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
        />
      )}
      <span aria-hidden="true" className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-blush-300 via-peach-300 to-sage-300" />
      <img
        src={ELI.avatar}
        alt={ELI.fullName}
        width={size}
        height={size}
        decoding="async"
        className="relative size-full rounded-full bg-ink-700 object-cover ring-2 ring-ink-900"
      />
    </span>
  );
}
