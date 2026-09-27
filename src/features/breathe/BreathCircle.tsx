import { type MotionValue, motion, useTransform } from 'motion/react';
import { type ReactNode, useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * A minimal breathing guide: a sea-glass disc that grows with each inhale and settles with each
 * exhale, a hairline ring around it with a mark where each phase begins, and a small light that
 * travels the ring through the whole cycle. The phase word sits inside the disc.
 */
export function BreathCircle({
  scale,
  turn,
  marks,
  children,
  className,
}: {
  /** Size of the disc (about 0.56 when empty, 1 when full). */
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
  return (
    <motion.div style={{ scale }} className={cn('relative aspect-square w-[min(64vw,320px)] will-change-transform', className)}>
      {/* hairline ring, with a mark where each phase begins */}
      <div className="absolute inset-[-9%]" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="size-full overflow-visible">
          <defs>
            <linearGradient id={`${id}-ring`} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#b4fff2" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="49" fill="none" stroke={`url(#${id}-ring)`} strokeWidth="0.55" />
          {marks.map((m) => {
            const a = m * Math.PI * 2 - Math.PI / 2;
            return <circle key={m} cx={50 + 49 * Math.cos(a)} cy={50 + 49 * Math.sin(a)} r="1.2" fill="#ffffff" opacity="0.85" />;
          })}
        </svg>
      </div>
      {/* the light that travels the ring */}
      <motion.div className="absolute inset-[-9%]" style={{ rotate }} aria-hidden="true">
        <span className="absolute top-[0.5%] left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_14px_4px_rgb(255_255_255/0.55)]" />
      </motion.div>
      <SeaGlass className="absolute inset-0" />
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </motion.div>
  );
}

/** The disc on its own: sea glass with light coming from above. */
export function SeaGlass({ className }: { className?: string }) {
  return (
    <div
      className={cn('rounded-full', className)}
      style={{
        background: 'linear-gradient(215deg, #72e8de 0%, #26a8bd 46%, #0a6a86 100%)',
        boxShadow: '0 34px 80px -26px rgb(2 38 48 / 0.65), 0 0 70px 4px rgb(126 242 226 / 0.22), inset 0 2px 1px rgb(255 255 255 / 0.28)',
      }}
      aria-hidden="true"
    >
      <div className="size-full rounded-full bg-[radial-gradient(circle_at_30%_24%,rgb(255_255_255/0.3),transparent_55%)]" />
    </div>
  );
}
