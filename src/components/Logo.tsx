import { useId } from 'react';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  const gid = `mf-mark-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg viewBox="0 0 48 48" className={cn('size-8', className)} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd6bd" />
          <stop offset="0.55" stopColor="#cfc6ff" />
          <stop offset="1" stopColor="#8fe0dc" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill={`url(#${gid})`} />
      <path
        d="M6.5 27.5c4.2-3.2 8.3-3.2 12.5 0s8.3 3.2 12.5 0 8.3-3.2 12 0"
        fill="none"
        stroke="#0a0f28"
        strokeOpacity="0.55"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M9 33.5c3.6-2.4 7.2-2.4 10.8 0s7.2 2.4 10.8 0 7.2-2.4 9.4 0"
        fill="none"
        stroke="#0a0f28"
        strokeOpacity="0.3"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="24" cy="17" r="4.2" fill="#fff" fillOpacity="0.9" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-[21px] leading-none tracking-[-0.02em]">MindFlow</span>
    </div>
  );
}
