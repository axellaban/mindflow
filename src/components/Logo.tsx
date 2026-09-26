import { useId } from 'react';
import { cn } from '@/lib/utils';

/** Lotus on a blush → peach moon. Also used by tools/brand to render the app icons. */
export function LogoMark({ className, size }: { className?: string; size?: number }) {
  const gid = `eli-mark-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={cn(size == null && 'size-8', className)} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#fde2e7" />
          <stop offset="0.5" stopColor="#f5b8c6" />
          <stop offset="1" stopColor="#f7b89a" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#${gid})`} />
      <g fill="#3a1f3d">
        <path d="M24 34.2c-7.6 1-13.7-1.6-16.6-6.4 5.9-1.3 11.8.6 16.6 6.4Z" fillOpacity="0.38" />
        <path d="M24 34.2c7.6 1 13.7-1.6 16.6-6.4-5.9-1.3-11.8.6-16.6 6.4Z" fillOpacity="0.38" />
        <path d="M24 34c-6.3-1.4-10.4-6.2-11.1-12.6 6.1 1.2 10 5.6 11.1 12.6Z" fillOpacity="0.62" />
        <path d="M24 34c6.3-1.4 10.4-6.2 11.1-12.6-6.1 1.2-10 5.6-11.1 12.6Z" fillOpacity="0.62" />
        <path d="M24 11.5c4.3 4.6 5.6 11.8 0 22.5-5.6-10.7-4.3-17.9 0-22.5Z" fillOpacity="0.9" />
      </g>
      <path d="M13.5 38.2c6.8 1.9 14.2 1.9 21 0" fill="none" stroke="#3a1f3d" strokeOpacity="0.3" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-[18px] leading-none tracking-[-0.02em] whitespace-nowrap">
        {compact ? 'Mindfulness' : (
          <>
            Mindfulness <span className="italic text-blush-300">by Eli</span>
          </>
        )}
      </span>
    </div>
  );
}
