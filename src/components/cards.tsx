import { Check, ChevronRight, Headphones, Play } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
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

export function Rail({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('no-scrollbar snap-row -my-2 flex gap-3.5 overflow-x-auto px-5 py-2 md:mx-0 md:px-0', className)}>{children}</div>
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
      className={cn('group flex shrink-0 flex-col text-left', size === 'md' ? 'w-[158px] md:w-[188px]' : 'w-[240px] md:w-[280px]', className)}
      aria-label={`${session.title}, ${formatDuration(session.duration)}`}
    >
      <div className="relative">
        <CoverArt spec={session.art} className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.01]" />
        <div className="absolute right-2.5 bottom-2.5 flex size-9 items-center justify-center rounded-full bg-ink-900/70 backdrop-blur-md">
          <Play className="ml-0.5 size-4 fill-current" />
        </div>
        {completed && (
          <div className="absolute top-2.5 left-2.5 flex size-6 items-center justify-center rounded-full bg-ink-900/50 backdrop-blur-md">
            <Check className="size-3.5" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <p className="mt-2.5 line-clamp-2 text-[15px] leading-snug font-semibold tracking-[-0.01em]">{session.title}</p>
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
      className="group relative block w-full overflow-hidden rounded-2xl text-left"
    >
      <CoverArt spec={session.art} ratio={1.45} rounded="rounded-2xl" live className="aspect-[1.45] w-full transition-transform duration-700 group-hover:scale-[1.02]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
        <div className="min-w-0">
          <p className="text-[12px] font-bold tracking-[0.14em] uppercase" style={{ color: p.ui }}>
            {eyebrow}
          </p>
          <h2 className="mt-1 font-display text-[28px] leading-[1.05] md:text-[34px]">{session.title}</h2>
          <p className="mt-1.5 line-clamp-1 text-[14px] text-2">
            {formatDuration(session.duration)} · {note ?? session.subtitle}
            {completed && ' · Completada'}
          </p>
        </div>
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-mist-50 text-ink-900 transition-transform duration-300 group-hover:scale-105">
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
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-mist-50 text-ink-900"
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
        <CoverArt spec={music.art} className="aspect-square w-full shadow-[0_18px_40px_-22px_rgb(0_0_0/0.9)]" />
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
