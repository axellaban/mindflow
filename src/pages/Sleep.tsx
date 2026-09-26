import { ArrowRight, Moon, Wind } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { CoverArt } from '@/art/CoverArt';
import { Scene } from '@/art/Scene';
import { MusicCard, ProgramCard, Rail, SessionCard, SessionRow } from '@/components/cards';
import { SectionTitle } from '@/components/ui/controls';
import { SLEEP_MEDITATIONS, STORIES } from '@/content/catalog';
import { SCENE_BY_ID } from '@/content/scenes';
import { MIX_PRESETS, MUSIC } from '@/content/sounds';
import { haptic } from '@/lib/device';
import { useProgramProgress } from '@/lib/hooks';
import { SPRING_PRESS } from '@/lib/motion';
import { usePlayer } from '@/store/player';

const SLEEP_MIXES = ['cabana-lluvia', 'playa-noche', 'noche-lago', 'tren-nocturno', 'invierno', 'tormenta-bosque'];

export function Sleep() {
  const programs = useProgramProgress();
  const sleepProgram = programs.find((p) => p.program.id === 'duerme-profundo')!;
  const playMix = usePlayer((s) => s.playMix);
  const expanded = usePlayer((s) => Boolean(s.item) && s.expanded);

  return (
    <div className="pb-12">
      <section className="relative h-[46svh] min-h-[340px] overflow-hidden lg:h-[52vh]">
        <Scene scene={SCENE_BY_ID.desierto} paused={expanded} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/40 via-transparent to-ink-900" />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 bottom-10 mx-auto max-w-5xl px-5 md:px-8 lg:px-10"
        >
          <p className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-2">
            <Moon className="size-4" /> Buenas noches
          </p>
          <h1 className="mt-1.5 font-display text-[42px] leading-[1.02] md:text-[54px]">Dormir</h1>
          <p className="mt-2 max-w-md text-[15px] text-2">Historias, prácticas y sonidos para soltar el día y descansar de verdad.</p>
        </motion.div>
      </section>

      <div className="mx-auto mt-2 max-w-5xl space-y-11 md:px-8 lg:px-10">
        <section>
          <SectionTitle title="Historias para dormir" />
          <Rail>
            {STORIES.map((s) => (
              <SessionCard key={s.id} session={s} size="lg" />
            ))}
          </Rail>
        </section>

        <section className="px-5 md:px-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <ProgramCard progress={sleepProgram} />
            <div className="max-w-sm">
              <p className="font-display text-[22px] leading-tight">Cinco noches para dormir mejor</p>
              <p className="mt-2 text-[15px] leading-relaxed text-2">{sleepProgram.program.outcome} Escúchalo ya en la cama, con la luz apagada.</p>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle title="Meditaciones para dormir" />
          <div className="grid grid-cols-1 gap-1 px-3 md:grid-cols-2 md:px-0">
            {SLEEP_MEDITATIONS.filter((s) => s.program?.id !== 'duerme-profundo').map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle
            title="Paisajes sonoros"
            action={
              <Link to="/sonidos" className="flex items-center gap-1 text-[13px] font-semibold text-2 hover:text-mist-50">
                Crear el tuyo <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <Rail>
            {MIX_PRESETS.filter((p) => SLEEP_MIXES.includes(p.id)).map((p) => (
              <motion.button
                key={p.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={SPRING_PRESS}
                onClick={() => {
                  haptic(8);
                  playMix({ id: p.id, name: p.name, mix: p.mix, art: p.art });
                }}
                className="w-[158px] shrink-0 text-left md:w-[188px]"
              >
                <CoverArt spec={p.art} className="aspect-square w-full" />
                <p className="mt-2.5 line-clamp-2 text-[15px] leading-snug font-semibold">{p.name}</p>
                <p className="text-[13px] text-3">Sin fin · con temporizador</p>
              </motion.button>
            ))}
          </Rail>
        </section>

        <section>
          <SectionTitle title="Música para dormir" />
          <Rail>
            {MUSIC.filter((m) => m.mood === 'dormir' || m.id === 'm-piano').map((m) => (
              <MusicCard key={m.id} music={m} />
            ))}
          </Rail>
        </section>

        <section className="px-5 md:px-0">
          <Link
            to="/respirar?patron=478"
            onClick={() => haptic(5)}
            className="glass flex items-center gap-4 rounded-[28px] p-5 transition-colors hover:bg-white/8"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-white/10">
              <Wind className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block text-[16px] font-semibold">Respiración 4-7-8 antes de dormir</span>
              <span className="block text-[13px] text-3">Tres minutos para calmar el sistema nervioso</span>
            </span>
            <ArrowRight className="size-4 text-3" />
          </Link>
        </section>
      </div>
    </div>
  );
}
