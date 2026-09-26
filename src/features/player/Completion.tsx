import { ArrowRight, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PROGRAM_BY_ID, SESSION_BY_ID } from '@/content/catalog';
import { MOODS, type MoodLevel } from '@/content/journal';
import type { Session } from '@/content/types';
import { haptic } from '@/lib/device';
import { programProgress, useStats } from '@/lib/hooks';
import { formatDuration } from '@/lib/time';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';

export function Completion({ session, onDone }: { session: Session; onDone: () => void }) {
  const stats = useStats();
  const addMood = useAppStore((s) => s.addMood);
  const programs = useAppStore((s) => s.programs);
  const listened = usePlayer((s) => s.listened);
  const playSession = usePlayer((s) => s.playSession);
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const minutes = Math.max(1, Math.round(listened / 60));

  const program = session.program ? PROGRAM_BY_ID[session.program.id] : null;
  const progress = program ? programProgress(program, programs[program.id] ?? []) : null;
  const next = progress?.nextSessionId ? SESSION_BY_ID[progress.nextSessionId] : null;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } } };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex w-full max-w-md flex-col items-center text-center">
      <motion.div variants={item} className="relative mb-6 flex size-28 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-mist-50/10"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="absolute inset-3 rounded-full bg-mist-50/15" />
        <svg viewBox="0 0 52 52" className="relative size-14">
          <motion.path
            d="M14 27 L23 36 L39 18"
            fill="none"
            stroke="#f6f4ff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: 0.45, ease: [0.65, 0, 0.35, 1] }}
          />
        </svg>
      </motion.div>
      <motion.p variants={item} className="text-[13px] font-bold tracking-[0.16em] text-2 uppercase">
        Sesión completada
      </motion.p>
      <motion.h2 variants={item} className="mt-2 font-display text-[34px] leading-tight">
        {session.daily ? 'Gracias por tu pausa' : 'Bien hecho'}
      </motion.h2>

      <motion.div variants={item} className="mt-6 grid w-full grid-cols-2 gap-3">
        <div className="glass rounded-3xl px-4 py-4">
          <p className="font-display text-[28px] leading-none tabular-nums">+{minutes}</p>
          <p className="mt-1.5 text-[13px] text-3">{minutes === 1 ? 'minuto de calma' : 'minutos de calma'}</p>
        </div>
        <div className="glass rounded-3xl px-4 py-4">
          <p className="flex items-center justify-center gap-1.5 font-display text-[28px] leading-none tabular-nums">
            <Flame className="size-5 text-peach-400" />
            {stats.streak}
          </p>
          <p className="mt-1.5 text-[13px] text-3">{stats.streak === 1 ? 'día de racha' : 'días de racha'}</p>
        </div>
      </motion.div>

      {session.daily && (
        <motion.blockquote variants={item} className="mt-5 w-full rounded-3xl border border-white/8 px-5 py-4">
          <p className="text-[12px] font-bold tracking-[0.14em] text-3 uppercase">Tu frase para hoy</p>
          <p className="mt-1.5 font-display text-[21px] leading-snug italic">“{session.daily.phrase}”</p>
        </motion.blockquote>
      )}

      {progress && program && (
        <motion.p variants={item} className="mt-5 text-[14px] text-2">
          {progress.complete
            ? `Completaste ${program.title}. ¡Felicitaciones!`
            : `${program.title}: ${progress.done.length} de ${program.sessions.length} completados`}
        </motion.p>
      )}

      <motion.div variants={item} className="mt-6 w-full">
        <p className="mb-3 text-[15px] font-semibold">¿Cómo te sientes ahora?</p>
        <div className="flex justify-center gap-2.5">
          {MOODS.map((m) => (
            <button
              key={m.level}
              type="button"
              onClick={() => {
                haptic(8);
                setMood(m.level);
                addMood({ level: m.level, feelings: [], source: 'after' });
              }}
              disabled={mood !== null}
              aria-label={m.label}
              className={cn('group flex flex-col items-center gap-1.5 transition-opacity', mood !== null && mood !== m.level && 'opacity-30')}
            >
              <span
                className={cn('block size-11 rounded-full transition-transform duration-300 group-hover:scale-110', mood === m.level && 'scale-110 ring-2 ring-white/80 ring-offset-2 ring-offset-transparent')}
                style={{ background: `radial-gradient(circle at 35% 30%, #ffffff, ${m.color} 60%)` }}
              />
              <span className="text-[11px] text-3">{m.label}</span>
            </button>
          ))}
        </div>
        {mood !== null && <p className="mt-3 text-[13px] text-2">Registrado en tu diario. Gracias por escucharte.</p>}
      </motion.div>

      <motion.div variants={item} className="mt-8 flex w-full flex-col gap-2.5">
        {next && (
          <Button
            full
            size="lg"
            onClick={() => playSession(next.id)}
            icon={<ArrowRight className="order-last size-5" />}
          >
            {program?.unit} {next.program?.day}: {next.title}
          </Button>
        )}
        <Button full size="lg" variant={next ? 'secondary' : 'primary'} onClick={onDone}>
          Listo
        </Button>
        {!next && <p className="mt-1 text-[12px] text-3">{formatDuration(session.duration)} · {session.subtitle}</p>}
      </motion.div>
    </motion.div>
  );
}
