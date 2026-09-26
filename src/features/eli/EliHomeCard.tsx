import { CalendarDays, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type EliEvent, type EliPlacement, eventUrl, nextEvent } from '@/content/eli';
import { goalsPhrase } from '@/content/goals';
import { useAppStore } from '@/store/app';
import { EliAvatar } from './EliAvatar';
import { EliInvite } from './EliInvite';
import { EliPrimaryLink, EliSecondaryLink, WhatsAppIcon, useEliLinks } from './actions';

const DAY = 86_400_000;

/** Eli's spot on the home feed: her next workshop while it's coming up, otherwise 1:1 sessions. */
export function EliHomeCard() {
  const goals = useAppStore((s) => s.profile.goals);
  const eventSnoozed = useAppStore((s) => (s.eli.snoozed.workshop ?? 0) > Date.now());
  const event = nextEvent();

  if (event && !eventSnoozed) return <EliEventCard event={event} />;

  const struggle = goalsPhrase(goals, 1);
  return (
    <EliInvite
      placement="home"
      eyebrow="Sesiones 1:1 con Eli"
      title="¿Querés ir más profundo?"
      body={
        struggle
          ? `Si te está costando ${struggle}, podemos trabajarlo juntas en una sesión online, a tu ritmo y con herramientas para tu vida real.`
          : 'Trabajemos juntas lo que te está pasando, en una sesión online a tu ritmo y con herramientas para tu vida real.'
      }
      more
    />
  );
}

export function EliEventCard({ event, placement = 'home', dismissible = true }: { event: EliEvent; placement?: EliPlacement; dismissible?: boolean }) {
  const links = useEliLinks(placement);
  const reduced = useReducedMotion();
  const snooze = useAppStore((s) => s.snoozeEli);
  const start = new Date(event.startsAt);
  const days = Math.ceil((start.getTime() - Date.now()) / DAY);
  const countdown = days <= 0 ? 'Es hoy' : days === 1 ? 'Es mañana' : `Faltan ${days} días`;
  const month = start.toLocaleDateString('es-AR', { month: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).replace('.', '');
  const dayOfMonth = start.toLocaleDateString('es-AR', { day: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(150deg,rgb(247_203_214/0.2),rgb(255_214_189/0.1)_50%,rgb(207_226_213/0.08))] p-5"
      aria-label={event.kind}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-peach-400/20 blur-3xl"
        animate={reduced ? undefined : { x: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />
      {dismissible && (
      <button
        type="button"
        onClick={() => snooze('workshop', Math.max(1, days + 1))}
        className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full text-mist-50/45 transition-colors hover:bg-white/8 hover:text-mist-50"
        aria-label="Ocultar"
        title="Ocultar"
      >
        <X className="size-4" />
      </button>
      )}

      <div className="relative flex items-start gap-4 pr-6">
        <div className="flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-2xl bg-mist-50 text-ink-900 shadow-[0_10px_24px_-12px_rgb(0_0_0/0.6)]">
          <span className="w-full bg-blush-400 py-0.5 text-center text-[10px] font-bold tracking-[0.12em] text-ink-900 uppercase">{month}</span>
          <span className="py-1 font-display text-[26px] leading-none">{dayOfMonth}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.16em] text-blush-300 uppercase">{event.kind}</p>
          <h3 className="mt-0.5 font-display text-[21px] leading-snug">{event.title}</h3>
        </div>
      </div>

      <p className="relative mt-3 text-[15px] leading-relaxed text-2">{event.subtitle}</p>
      <div className="relative mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-2">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {event.when}
        </span>
        <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[12px] font-semibold text-mist-50">{countdown}</span>
      </div>
      <p className="relative mt-1 text-[12.5px] text-3">{event.format}</p>

      <div className="relative mt-4 flex flex-wrap items-center gap-x-1 gap-y-2">
        <EliPrimaryLink href={eventUrl(event, placement)} onClick={() => links.track('event')}>
          Quiero participar
        </EliPrimaryLink>
        <EliSecondaryLink href={links.whatsapp('workshop')} onClick={() => links.track('whatsapp')} icon={<WhatsAppIcon className="size-4" />}>
          ¿Dudas? Escribime
        </EliSecondaryLink>
      </div>
      <div className="relative mt-3 flex items-center gap-2 border-t border-white/8 pt-3 text-[12.5px] text-3">
        <EliAvatar size={22} halo={false} />
        Con Eli, profesora de mindfulness con formación MBSR
      </div>
    </motion.section>
  );
}
