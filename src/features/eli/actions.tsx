import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { type EliPlacement, type WhatsAppTopic, bookingUrl, whatsappMessage, whatsappUrl } from '@/content/eli';
import { goalsPhrase } from '@/content/goals';
import { haptic } from '@/lib/device';
import { EASE_IN_OUT, press } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-4', className)} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-4', className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Links to Eli's booking form and WhatsApp, personalised with the user's name and goals. */
export function useEliLinks(placement: EliPlacement) {
  const name = useAppStore((s) => s.profile.name);
  const goals = useAppStore((s) => s.profile.goals);
  const track = useAppStore((s) => s.trackEliClick);
  const first = name.trim().split(/\s+/)[0] || undefined;
  return {
    booking: bookingUrl(placement),
    whatsapp: (topic: WhatsAppTopic, extra: { program?: string } = {}) =>
      whatsappUrl(whatsappMessage(topic, { name: first, struggles: goalsPhrase(goals), ...extra })),
    track: (what: 'book' | 'whatsapp' | 'event' | 'instagram') => {
      haptic(8);
      track(`${what}:${placement}`);
    },
  };
}

interface ExternalProps {
  href: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

/** The main call to action: a sage-to-dawn gradient pill with a slow shimmer. */
export function EliPrimaryLink({ href, onClick, children, className, icon }: ExternalProps) {
  const reduced = useReducedMotion();
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      {...press}
      className={cn(
        'relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-blush-300 to-gold-300 px-6 text-[15px] font-semibold text-ink-900 shadow-[0_12px_32px_-12px_rgb(124_197_191/0.6)]',
        className,
      )}
    >
      {!reduced && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
          initial={{ left: '-60%' }}
          animate={{ left: ['-60%', '140%'] }}
          transition={{ duration: 2.6, ease: EASE_IN_OUT, repeat: Infinity, repeatDelay: 8, delay: 2 }}
        />
      )}
      {icon}
      <span className="relative">{children}</span>
    </motion.a>
  );
}

export function EliSecondaryLink({ href, onClick, children, className, icon }: ExternalProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={cn(
        'inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-[14.5px] font-semibold text-mist-50/85 transition-colors hover:bg-white/6 hover:text-mist-50',
        className,
      )}
    >
      {icon}
      {children}
    </a>
  );
}
