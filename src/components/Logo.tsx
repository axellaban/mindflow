import { cn } from '@/lib/utils';

/**
 * Three-petal lotus on a sea-glass moon. Kept flat and simple so it still reads as a
 * 16px favicon; public/favicon.svg is the same drawing and tools/brand renders
 * the app icons from this component.
 */
export function LogoMark({ className, size }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={cn(size == null && 'size-8', className)} aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#a8dcd5" />
      <path d="M22.6 35.5C16 34.8 11.4 30.2 10.6 22.8c6 1.3 10.2 5.5 12 12.7Z" fill="#2e7280" />
      <path d="M25.4 35.5C32 34.8 36.6 30.2 37.4 22.8c-6 1.3-10.2 5.5-12 12.7Z" fill="#2e7280" />
      <path d="M24 11.7c4.6 4.9 6 12.4 0 23.5-6-11.1-4.6-18.6 0-23.5Z" fill="#0f2330" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-display text-[21px] leading-none font-semibold tracking-[-0.01em] whitespace-nowrap">
        {compact ? 'CalmabyEli' : (
          <>
            Calma<span className="italic text-blush-300">byEli</span>
          </>
        )}
      </span>
    </div>
  );
}
