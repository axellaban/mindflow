import { ArrowRight, Flame } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PROGRAM_BY_ID, SESSION_BY_ID } from '@/content/catalog';
import { MOODS, type MoodLevel } from '@/content/journal';
import type { Session } from '@/content/types';
import { EliInvite, type EliInviteProps } from '@/features/eli/EliInvite';
import { useEliInvite } from '@/features/eli/useEliInvite';
import { haptic } from '@/lib/device';
import { programProgress, useStats } from '@/lib/hooks';
import { formatDuration } from '@/lib/time';
import { EASE, EASE_IN_OUT, breath, reveal, revealFocus, stagger } from '@/lib/motion';
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
  const completedCount = useAppStore((s) => s.history.filter((h) => h.kind === 'session' && h.completed).length);
  const [programEnd] = useState(() => Boolean(progress?.complete && session.program?.day === program?.sessions.length));
  // An invitation from Eli after the mood check: never on the first session, never too often.
  const eli = useEliInvite(programEnd ? 'program' : 'completion', programEnd || (mood !== null && completedCount >= 2), programEnd ? 30 : 3, programEnd ? 2 : 5);
  const invite = eliCopy(session, mood, programEnd ? program?.title : undefined);

  const container = stagger(0.1, 0.2);
  const item = reveal;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex w-full max-w-md flex-col items-center text-center">
      <motion.div variants={item} className="relative mb-6 flex size-28 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-mist-50/10"
          animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0.18, 0.6] }}
          transition={breath}
        />
        <span className="absolute inset-3 rounded-full bg-mist-50/15" />
        <svg viewBox="0 0 52 52" className="relative size-14">
          <motion.path
            d="M14 27 L23 36 L39 18"
            fill="none"
            stroke="#f4f1e9"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, delay: 0.55, ease: EASE_IN_OUT }}
          />
        </svg>
      </motion.div>
      <motion.p variants={item} className="text-[13px] font-bold tracking-[0.16em] text-2 uppercase">
        Sesión completada
      </motion.p>
      <motion.h2 variants={revealFocus} className="mt-2 font-display text-[34px] leading-tight">
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
        <p className="mb-3 text-[15px] font-semibold">¿Cómo te sentís ahora?</p>
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
        <AnimatePresence>
          {mood !== null && (
            <motion.p
              className="mt-3 text-[13px] text-2"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            >
              Registrado en tu diario. Gracias por escucharte.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {eli.show && (
          <EliInvite
            key="eli"
            {...invite}
            placement={programEnd ? 'program' : 'completion'}
            onDismiss={() => eli.dismiss(programEnd ? 30 : 10)}
            delay={programEnd ? 0.9 : 0.35}
            className="mt-6 w-full text-left"
          />
        )}
      </AnimatePresence>

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

type InviteCopy = Pick<EliInviteProps, 'eyebrow' | 'title' | 'body' | 'lead' | 'topic' | 'program' | 'whatsappLabel'>;

/** What Eli would say right after this practice, given how she feels now. */
function eliCopy(session: Session, mood: MoodLevel | null, finishedProgram?: string): InviteCopy {
  if (finishedProgram) {
    return {
      eyebrow: 'Un mensaje de Eli',
      title: `Terminaste ${finishedProgram}`,
      body: 'Qué lindo acompañarte en este camino. Si querés seguir profundizando, podemos trabajar juntas lo que más te está costando en una sesión 1:1 online.',
      topic: 'program',
      program: finishedProgram,
    };
  }
  if (mood !== null && mood <= 2) {
    return {
      eyebrow: 'Un mensaje de Eli',
      title: 'Gracias por darte este momento',
      body: 'Si hoy está siendo un día difícil y tenés ganas de hablarlo, estoy a un mensaje.',
      lead: 'whatsapp',
      topic: 'support',
      whatsappLabel: 'Escribirle a Eli',
    };
  }
  if (session.categories.includes('autoexigencia')) {
    return {
      eyebrow: 'Sesiones 1:1 con Eli',
      title: 'Esto es lo que trabajamos juntas',
      body: 'El estrés, la autoexigencia y la culpa son justamente lo que más trabajo con mujeres en mis sesiones. ¿Te gustaría que lo veamos a tu medida?',
    };
  }
  if (mood !== null && mood >= 4) {
    return {
      eyebrow: 'Sesiones 1:1 con Eli',
      title: 'Esta calma se puede entrenar',
      body: 'En una sesión 1:1 te acompaño a llevarla a tu día a día, con prácticas pensadas para tu vida real.',
    };
  }
  return {
    eyebrow: 'Sesiones 1:1 con Eli',
    title: '¿Querés ir un paso más allá?',
    body: 'En una sesión 1:1 armamos juntas una práctica a tu medida, para lo que estás viviendo hoy.',
  };
}
