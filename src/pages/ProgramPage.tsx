import { Check, ChevronLeft, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useParams } from 'react-router';
import { CoverArt } from '@/art/CoverArt';
import { PALETTES } from '@/art/palettes';
import { Button, IconButton } from '@/components/ui/Button';
import { PROGRAM_BY_ID, SESSION_BY_ID } from '@/content/catalog';
import type { ProgramId } from '@/content/types';
import { EliInvite } from '@/features/eli/EliInvite';
import { haptic } from '@/lib/device';
import { programProgress, useBack } from '@/lib/hooks';
import { formatDuration } from '@/lib/time';
import { cn } from '@/lib/utils';
import { SPRING_PRESS } from '@/lib/motion';
import { useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';
import { NotFound } from './NotFound';

const EMPTY: number[] = [];

export function ProgramPage() {
  const { id } = useParams();
  const back = useBack('/meditar');
  const program = PROGRAM_BY_ID[id as ProgramId];
  const allPrograms = useAppStore((s) => s.programs);
  const done = (program && allPrograms[program.id]) || EMPTY;
  const play = usePlayer((s) => s.playSession);
  if (!program) return <NotFound />;
  const progress = programProgress(program, done);
  const p = PALETTES[program.art.palette];
  const total = program.sessions.length;
  const cta = progress.complete
    ? { label: 'Repetir desde el inicio', id: program.sessions[0]! }
    : { label: done.length ? `Continuar · ${program.unit} ${progress.nextDay}` : `Comenzar · ${program.unit} 1`, id: progress.nextSessionId! };

  return (
    <div className="pb-14">
      <section className="relative overflow-hidden lg:mt-6 lg:rounded-[40px]">
        <CoverArt spec={program.art} ratio={0.95} rounded="rounded-none" live className="aspect-[0.95] w-full md:aspect-[1.9]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-900" />
        <div className="absolute top-0 left-0 px-5 pt-safe lg:px-8 lg:pt-6">
          <div className="pt-2">
            <IconButton label="Volver" onClick={back}>
              <ChevronLeft className="size-5" />
            </IconButton>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 bottom-0 px-5 pb-6 lg:px-8"
        >
          <p className="text-[12px] font-bold tracking-[0.16em] uppercase" style={{ color: p.ui }}>
            Programa · {program.subtitle}
          </p>
          <h1 className="mt-1.5 font-display text-[42px] leading-[1.02] md:text-[56px]">{program.title}</h1>
        </motion.div>
      </section>

      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <p className="mt-4 text-[16px] leading-relaxed text-2">{program.description}</p>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-mist-50"
              initial={{ width: 0 }}
              animate={{ width: `${(done.length / total) * 100}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="text-[13px] font-semibold text-2 tabular-nums">
            {done.length} de {total}
          </span>
        </div>
        <Button full size="lg" className="mt-6" icon={<Play className="size-5 fill-current" />} onClick={() => play(cta.id)}>
          {cta.label}
        </Button>

        <h2 className="mt-9 mb-2 px-1 font-display text-[22px] leading-tight">
          {total} {program.unit === 'Día' ? 'días' : 'noches'}, una práctica por {program.unit === 'Día' ? 'día' : 'noche'}
        </h2>
        <ol className="space-y-1.5">
          {program.sessions.map((sid, i) => {
            const s = SESSION_BY_ID[sid];
            if (!s) return null;
            const isDone = done.includes(i + 1);
            const isNext = progress.nextDay === i + 1;
            return (
              <li key={sid}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  transition={SPRING_PRESS}
                  onClick={() => {
                    haptic(8);
                    play(sid);
                  }}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-3xl p-3 text-left transition-colors',
                    isNext ? 'bg-white/9' : 'hover:bg-white/5',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold tabular-nums',
                      isDone ? 'bg-sage-400 text-ink-900' : isNext ? 'bg-mist-50 text-ink-900' : 'bg-white/7 text-mist-50/95',
                    )}
                  >
                    {isDone ? <Check className="size-5" strokeWidth={2.6} /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-bold tracking-[0.12em] text-3 uppercase">
                      {program.unit} {i + 1}
                    </span>
                    <span className="block truncate text-[16px] font-semibold">{s.title}</span>
                    <span className="block truncate text-[13px] text-3">
                      {formatDuration(s.duration)} · {s.subtitle}
                    </span>
                  </span>
                  <Play className={cn('size-4 shrink-0 fill-current', isNext ? 'text-mist-50' : 'text-mist-50/60')} />
                </motion.button>
              </li>
            );
          })}
        </ol>
        <p className="mt-8 text-center text-[13px] text-3">{program.outcome}</p>
        {program.unit !== 'Noche' && (
          <EliInvite
            placement="program"
            eyebrow="Sesiones 1:1 con Eli"
            title={program.id === 'bajar-un-cambio' ? 'Estos son los temas que trabajo con mujeres' : '¿Querés ir más profundo?'}
            body={
              program.id === 'bajar-un-cambio'
                ? 'El estrés, la autoexigencia, la culpa y el descanso son el centro de mis sesiones 1:1. Si querés, los trabajamos juntas a tu medida.'
                : 'Si querés acompañamiento para lo que estás viviendo, en una sesión 1:1 armamos juntas una práctica a tu medida.'
            }
            topic={progress.complete ? 'program' : 'program-doing'}
            program={program.title}
            more
            className="mt-8"
          />
        )}
      </div>
    </div>
  );
}
