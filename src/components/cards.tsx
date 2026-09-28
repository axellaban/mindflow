import { ArrowLeft, ArrowRight, Check, ChevronRight, Headphones, Play } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { CoverArt } from '@/art/CoverArt';
import { PALETTES } from '@/art/palettes';
import { sessionKindLabel } from '@/content/catalog';
import type { MusicDef } from '@/content/sounds';
import type { Session } from '@/content/types';
import { haptic } from '@/lib/device';
import { type ProgramProgress, useCompletedSessions } from '@/lib/hooks';
import { formatDuration } from '@/lib/time';
import { SPRING_PRESS, press } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/store/player';

const tap = press;

export function Rail({ children, className, label = 'Colección de prácticas' }: { children: ReactNode; className?: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const reduced = useReducedMotion();
  const [position, setPosition] = useState({ start: true, end: true, progress: 0 });

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;
    const measure = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const progress = max > 1 ? rail.scrollLeft / max : 0;
      setPosition({ start: rail.scrollLeft <= 2, end: rail.scrollLeft >= max - 2, progress });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    Array.from(rail.children).forEach((child) => observer.observe(child));
    rail.addEventListener('scroll', measure, { passive: true });
    measure();
    return () => {
      observer.disconnect();
      rail.removeEventListener('scroll', measure);
    };
  }, [children]);

  const scroll = (direction: number) => {
    const rail = ref.current;
    if (rail) rail.scrollBy({ left: direction * rail.clientWidth * 0.8, behavior: reduced ? 'instant' : 'smooth' });
  };

  return (
    <div className="min-w-0">
      <div ref={ref} id={id} role="region" aria-label={label} tabIndex={0} className={cn('no-scrollbar snap-row -my-2 flex gap-4 overflow-x-auto px-5 py-2 md:mx-0 md:px-0', className)}>{children}</div>
      <div className={cn('mt-4 hidden h-11 items-center gap-3 md:flex', position.start && position.end && 'invisible')}>
        <div className="mr-auto h-px w-24 overflow-hidden bg-white/15" aria-hidden="true">
          <div className="h-full w-1/3 bg-coral-300" style={{ transform: `translateX(${Math.max(0, Math.min(1, position.progress)) * 200}%)` }} />
        </div>
        <button type="button" className="rail-arrow" aria-label={`Anterior: ${label}`} title="Anterior" aria-controls={id} disabled={position.start} onClick={() => scroll(-1)}><ArrowLeft className="size-4" /></button>
        <button type="button" className="rail-arrow" aria-label={`Siguiente: ${label}`} title="Siguiente" aria-controls={id} disabled={position.end} onClick={() => scroll(1)}><ArrowRight className="size-4" /></button>
      </div>
    </div>
  );
}

export function SessionCard({ session, className, size = 'md' }: { session: Session; className?: string; size?: 'md' | 'lg' }) {
  const completed = useCompletedSessions().has(session.id);
  const play = usePlayer((s) => s.playSession);
  return (
    <motion.button
      type="button"
      {...tap}
      onClick={() => {
        haptic(8);
        play(session.id);
      }}
      className={cn('session-card group flex min-w-0 shrink-0 flex-col text-left', size === 'md' ? 'w-[164px] md:w-[200px]' : 'w-[240px] md:w-[300px]', className)}
      aria-label={`${session.title}, ${formatDuration(session.duration)}`}
    >
      <div className="session-cover relative w-full overflow-hidden rounded-2xl">
        <CoverArt spec={session.art} ratio={size === 'md' ? 0.85 : 1.2} className={cn('session-art w-full', size === 'md' ? 'aspect-[0.85]' : 'aspect-[1.2]')} />
        <div className="session-play absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full border border-white/25 bg-ink-950/65 backdrop-blur-md">
          <Play className="ml-0.5 size-4 fill-current" />
        </div>
        {completed && (
          <div className="absolute top-2.5 left-2.5 flex size-6 items-center justify-center rounded-full bg-ink-900/50 backdrop-blur-md">
            <Check className="size-3.5" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <p className="mt-3 line-clamp-2 text-[15px] leading-snug font-medium">{session.title}</p>
      <p className="mt-0.5 text-[13px] text-3">
        {formatDuration(session.duration)} · {session.kind === 'story' ? 'Historia' : sessionKindLabel(session)}
      </p>
    </motion.button>
  );
}

export function SessionRow({ session, index, right }: { session: Session; index?: number; right?: ReactNode }) {
  const completed = useCompletedSessions().has(session.id);
  const play = usePlayer((s) => s.playSession);
  return (
    <motion.button
      type="button"
      {...tap}
      onClick={() => {
        haptic(8);
        play(session.id);
      }}
      className="group flex w-full items-center gap-4 rounded-3xl p-2 text-left transition-colors hover:bg-white/5"
    >
      <div className="relative size-16 shrink-0">
        <CoverArt spec={session.art} rounded="rounded-2xl" className="size-16" grain={false} />
        {completed && (
          <div className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 border-ink-800 bg-sage-400 text-ink-900">
            <Check className="size-3" strokeWidth={3} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {index != null && <p className="text-[12px] font-semibold tracking-wide text-3 uppercase">{sessionKindLabel(session)}</p>}
        <p className="truncate text-[16px] font-semibold tracking-[-0.01em]">{session.title}</p>
        <p className="truncate text-[13px] text-3">
          {formatDuration(session.duration)} · {session.subtitle}
        </p>
      </div>
      {right ?? (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/8 transition-colors group-hover:bg-white/15">
          <Play className="ml-0.5 size-4 fill-current" />
        </div>
      )}
    </motion.button>
  );
}

export function HeroSessionCard({ session, eyebrow, note }: { session: Session; eyebrow: string; note?: string }) {
  const play = usePlayer((s) => s.playSession);
  const completed = useCompletedSessions().has(session.id);
  const p = PALETTES[session.art.palette];
  return (
    <motion.button
      type="button"
      {...tap}
      onClick={() => {
        haptic(10);
        play(session.id);
      }}
      className="hero-session group relative flex h-full min-h-[224px] w-full flex-col justify-between overflow-hidden rounded-2xl text-left lg:min-h-[332px]"
    >
      <CoverArt spec={session.art} ratio={1.5} rounded="rounded-2xl" live className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/15 to-ink-950/30" />
      <div className="relative flex w-full items-center justify-between gap-2 p-5 md:p-6">
        <p className="flex items-center gap-2 text-[12px] font-medium text-mist-50"><Headphones className="size-4" />{eyebrow}</p>
        <span className="rounded-full border border-white/25 px-2.5 py-1 text-[11px] text-mist-50">{formatDuration(session.duration)}</span>
      </div>
      <div className="relative flex w-full items-end justify-between gap-4 p-5 md:p-6">
        <div className="min-w-0">
          {completed && <p className="mb-2 flex items-center gap-1.5 text-[12px]" style={{ color: p.ui }}><Check className="size-3.5" />Completada</p>}
          <h2 className="font-display text-[34px] leading-[1.05] md:text-[40px]">{session.title}</h2>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-2">{note && note !== session.title ? note : session.subtitle}</p>
        </div>
        <div className="hero-play flex size-14 shrink-0 items-center justify-center rounded-full bg-coral text-ink-950">
          <Play className="ml-1 size-6 fill-current" />
        </div>
      </div>
    </motion.button>
  );
}

export function ProgramCard({ progress, className }: { progress: ProgramProgress; className?: string }) {
  const { program, done } = progress;
  const total = program.sessions.length;
  const p = PALETTES[program.art.palette];
  return (
    <motion.div {...tap} className={cn('shrink-0', className)}>
      <Link
        to={`/programa/${program.id}`}
        className="group relative block w-[280px] overflow-hidden rounded-[28px] md:w-[320px]"
        onClick={() => haptic(6)}
      >
        <CoverArt spec={program.art} ratio={1.2} rounded="rounded-[28px]" live className="aspect-[1.2] w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[12px] font-bold tracking-[0.14em] uppercase" style={{ color: p.ui }}>
            Programa · {total} {program.unit === 'Día' ? 'días' : 'noches'}
          </p>
          <h3 className="mt-1 font-display text-[25px] leading-tight">{program.title}</h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-mist-50 transition-[width] duration-700" style={{ width: `${(done.length / total) * 100}%` }} />
            </div>
            <span className="text-[12px] font-semibold text-2 tabular-nums">
              {done.length}/{total}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ContinueCard({ progress }: { progress: ProgramProgress }) {
  const play = usePlayer((s) => s.playSession);
  const { program, nextDay, done } = progress;
  if (!nextDay || !progress.nextSessionId) return null;
  const total = program.sessions.length;
  return (
    <div className="glass flex items-center gap-4 rounded-[28px] p-3 pr-4">
      <Link to={`/programa/${program.id}`} className="flex min-w-0 flex-1 items-center gap-4" onClick={() => haptic(5)}>
        <CoverArt spec={program.art} rounded="rounded-[20px]" className="size-[72px] shrink-0" grain={false} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold tracking-[0.12em] text-3 uppercase">Continuar</p>
          <p className="truncate text-[16px] font-semibold">{program.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex gap-1" aria-hidden="true">
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={cn('h-1.5 w-3.5 rounded-full', done.includes(i + 1) ? 'bg-mist-50' : 'bg-white/15')} />
              ))}
            </div>
            <span className="text-[12px] text-3">
              {program.unit} {nextDay} de {total}
            </span>
          </div>
        </div>
      </Link>
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        transition={SPRING_PRESS}
        aria-label={`Reproducir ${program.unit.toLowerCase()} ${nextDay}`}
        onClick={() => {
          haptic(10);
          play(progress.nextSessionId!);
        }}
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-coral text-ink-950"
      >
        <Play className="ml-0.5 size-5 fill-current" />
      </motion.button>
    </div>
  );
}

export function MusicCard({ music, className }: { music: MusicDef; className?: string }) {
  const play = usePlayer((s) => s.playMusic);
  return (
    <motion.button
      type="button"
      {...tap}
      onClick={() => {
        haptic(8);
        play(music.id);
      }}
      className={cn('group flex w-[158px] shrink-0 flex-col text-left md:w-[188px]', className)}
    >
      <div className="relative">
        <CoverArt spec={music.art} className="aspect-square w-full shadow-[0_18px_40px_-22px_rgb(2_38_48/0.9)]" />
        {music.headphones && (
          <div className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-ink-900/50 backdrop-blur-md" title="Mejor con auriculares">
            <Headphones className="size-3.5" />
          </div>
        )}
      </div>
      <p className="mt-2.5 line-clamp-1 text-[15px] font-semibold tracking-[-0.01em]">{music.title}</p>
      <p className="mt-0.5 line-clamp-1 text-[13px] text-3">{music.subtitle}</p>
    </motion.button>
  );
}

export function LinkRow({ to, title, subtitle, icon }: { to: string; title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <Link to={to} onClick={() => haptic(5)} className="flex items-center gap-4 rounded-2xl px-2 py-3 transition-colors hover:bg-white/5">
      {icon && <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/8">{icon}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{title}</p>
        {subtitle && <p className="text-[13px] text-3">{subtitle}</p>}
      </div>
      <ChevronRight className="size-4 text-3" />
    </Link>
  );
}
