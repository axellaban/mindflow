import { ArrowRight, CalendarHeart, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { EliPlacement, WhatsAppTopic } from '@/content/eli';
import { cn } from '@/lib/utils';
import { EliAvatar } from './EliAvatar';
import { EliPrimaryLink, EliSecondaryLink, WhatsAppIcon, useEliLinks } from './actions';

export interface EliInviteProps {
  placement: EliPlacement;
  eyebrow?: string;
  title: string;
  body: ReactNode;
  /** Which action leads: booking a 1:1 session or a WhatsApp chat. */
  lead?: 'book' | 'whatsapp';
  topic?: WhatsAppTopic;
  program?: string;
  bookLabel?: string;
  whatsappLabel?: string;
  /** Show the "Conocé a Eli" link to her page. */
  more?: boolean;
  signature?: boolean;
  onDismiss?: () => void;
  delay?: number;
  className?: string;
}

/** A short, personal note from Eli with one clear next step. */
export function EliInvite({
  placement,
  eyebrow,
  title,
  body,
  lead = 'book',
  topic = 'sessions',
  program,
  bookLabel = 'Agendar mi sesión',
  whatsappLabel,
  more,
  signature,
  onDismiss,
  delay = 0,
  className,
}: EliInviteProps) {
  const links = useEliLinks(placement);
  const reduced = useReducedMotion();
  const wa = links.whatsapp(topic, { program });

  const book = (
    <EliPrimaryLink key="book" href={links.booking} onClick={() => links.track('book')} icon={<CalendarHeart className="relative size-4.5" />}>
      {bookLabel}
    </EliPrimaryLink>
  );
  const chatPrimary = (
    <EliPrimaryLink key="wa" href={wa} onClick={() => links.track('whatsapp')} icon={<WhatsAppIcon className="relative size-4.5" />}>
      {whatsappLabel ?? 'Escribirle a Eli'}
    </EliPrimaryLink>
  );
  const chatSecondary = (
    <EliSecondaryLink key="wa2" href={wa} onClick={() => links.track('whatsapp')} icon={<WhatsAppIcon className="size-4" />}>
      {whatsappLabel ?? '¿Dudas? Escribime'}
    </EliSecondaryLink>
  );
  const bookSecondary = (
    <EliSecondaryLink key="book2" href={links.booking} onClick={() => links.track('book')} icon={<CalendarHeart className="size-4" />}>
      {bookLabel}
    </EliSecondaryLink>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(140deg,rgb(197_213_188/0.16),rgb(246_222_175/0.07)_48%,rgb(207_226_213/0.07))] p-5 backdrop-blur-xl',
        className,
      )}
      aria-label={eyebrow ?? title}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-12 size-48 rounded-full bg-blush-400/25 blur-3xl"
        animate={reduced ? undefined : { x: [0, -18, 0], y: [0, 12, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full text-mist-50/45 transition-colors hover:bg-white/8 hover:text-mist-50"
          aria-label="Ahora no"
          title="Ahora no"
        >
          <X className="size-4" />
        </button>
      )}

      <div className="relative flex items-center gap-3.5 pr-6">
        <EliAvatar size={52} />
        <div className="min-w-0">
          {eyebrow && <p className="text-[11px] font-bold tracking-[0.16em] text-blush-300 uppercase">{eyebrow}</p>}
          <h3 className="mt-0.5 font-display text-[21px] leading-snug">{title}</h3>
        </div>
      </div>
      <div className="relative mt-3 text-[15px] leading-relaxed text-2">{body}</div>
      {signature && <p className="relative mt-2 font-display text-[20px] font-semibold text-blush-300 italic">Eli</p>}

      <div className="relative mt-4 flex flex-wrap items-center gap-x-1 gap-y-2">
        {lead === 'book' ? [book, chatSecondary] : [chatPrimary, bookSecondary]}
      </div>
      {more && (
        <Link
          to="/eli"
          className="relative mt-1 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-mist-50/60 transition-colors hover:text-mist-50"
        >
          Conocé a Eli <ArrowRight className="size-3.5" />
        </Link>
      )}
    </motion.section>
  );
}
