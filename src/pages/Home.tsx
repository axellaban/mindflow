import { ArrowRight, Check, ChevronDown, LifeBuoy, Moon, Mountain, Share2, Timer, Volume2, VolumeX, Wind } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { engine } from '@/audio/engine';
import { Landscape } from '@/art/landscape';
import { Scene } from '@/art/Scene';
import { ContinueCard, HeroSessionCard, ProgramCard, Rail, SessionCard } from '@/components/cards';
import { LogoMark } from '@/components/Logo';
import { IconButton } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { SectionTitle } from '@/components/ui/controls';
import { Words } from '@/components/ui/Words';
import { MoodOrb } from '@/features/checkin/CheckInSheet';
import { EliAvatar } from '@/features/eli/EliAvatar';
import { EliHomeCard } from '@/features/eli/EliHomeCard';
import { FEELINGS, MOODS } from '@/content/journal';
import { quoteForDay } from '@/content/quotes';
import { dailyFor, forDayPart, recommended, suggestedProgram } from '@/content/recommend';
import { AUTO_SCENE_NAME, SCENES, SCENE_BY_ID, type SceneChoice, type SceneId, beachAt, resolveScene } from '@/content/scenes';
import { haptic, shareOrCopy } from '@/lib/device';
import { SPRING_PRESS, reveal, stagger } from '@/lib/motion';
import { programProgress, useActiveProgram, useNow } from '@/lib/hooks';
import { minutesByDay, currentWeek } from '@/lib/stats';
import { dayKey, dayNumber, fromDayKey, greeting, longDate, shortWeekday } from '@/lib/time';
import { cn } from '@/lib/utils';
import { type MoodEntry, useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';

const sections = stagger(0.08, 0.2);

export function Home() {
  const now = useNow();
  const profile = useAppStore((s) => s.profile);
  const history = useAppStore((s) => s.history);
  const moods = useAppStore((s) => s.moods);
  const programs = useAppStore((s) => s.programs);
  const sceneId = useAppStore((s) => s.settings.sceneId);
  const sceneSound = useAppStore((s) => s.settings.sceneSound);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const playerItem = usePlayer((s) => s.item);
  const active = useActiveProgram();
  const [scenesOpen, setScenesOpen] = useState(false);
  const reduced = useReducedMotion();
  // the scene sleeps while the full-screen player covers it
  const covered = usePlayer((s) => s.expanded && Boolean(s.item));
  // the landscape scrolls slower than the page, and the greeting fades as it leaves
  const { scrollY } = useScroll();
  const sceneY = useTransform(scrollY, [0, 500], [0, 140]);
  const greetingOpacity = useTransform(scrollY, [0, 240], [1, 0]);
  const greetingY = useTransform(scrollY, [0, 240], [0, -20]);

  // the beach follows the light of the day unless a fixed scene was chosen
  const scene = useMemo(() => resolveScene(sceneId, now), [sceneId, now]);
  const sceneChoices = useMemo(
    () => [
      { id: 'auto' as SceneChoice, name: AUTO_SCENE_NAME, note: 'Amanecer, día, atardecer o noche', preview: beachAt(now).id },
      ...SCENES.map((s) => ({ id: s.id as SceneChoice, name: s.name, note: undefined, preview: s.id })),
    ],
    [now],
  );
  const daily = useMemo(() => dailyFor(now), [now]);
  const forYou = useMemo(() => recommended(profile, history, now), [profile, history, now]);
  const part = useMemo(() => forDayPart(now), [now]);
  const quote = quoteForDay(dayNumber(now));
  const todayMood = [...moods].reverse().find((m) => m.day === dayKey(now));
  const suggested = suggestedProgram(profile);
  const suggestedProgress = programProgress(suggested, programs[suggested.id] ?? []);
  const name = profile.name.trim().split(' ')[0];

  // Scene soundscape on the home screen (only while nothing else plays)
  useEffect(() => {
    if (!sceneSound || playerItem) return;
    let started = false;
    const start = () => {
      started = true;
      engine.unlock(true);
      engine.setLayersVolume(0.55, 0.5);
      engine.setMix(scene.sound, 3);
    };
    if (engine.running) start();
    else window.addEventListener('pointerdown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      if (started && !usePlayer.getState().item) {
        engine.stopAll(1.5);
        engine.releaseKeepAlive();
      }
    };
  }, [sceneSound, scene, playerItem]);

  const toggleSceneSound = () => {
    haptic(6);
    if (!sceneSound) engine.unlock(true);
    updateSettings({ sceneSound: !sceneSound });
  };

  return (
    <div className="relative pb-10">
      {/* Hero scene */}
      <section className="relative h-[48svh] min-h-[350px] max-h-[510px] overflow-hidden lg:h-[50vh]">
        <motion.div className="absolute inset-0" style={reduced ? undefined : { y: sceneY }}>
          <Scene scene={scene} drift={false} paused={covered} />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/35 via-transparent to-ink-900" />
        {/* a soft veil where the greeting sits, so the scene never competes with it */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_55%_at_20%_78%,rgb(4_52_64/0.5),transparent_75%)]" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-safe lg:px-10 lg:pt-6">
          <Link to="/" className="flex items-center gap-2.5 lg:invisible" aria-label="CalmabyEli">
            <LogoMark className="size-8" />
            <span className="font-display text-[20px] leading-none font-semibold tracking-[-0.005em] text-mist-50/95 max-[379px]:hidden">
              Calma<span className="text-blush-300 italic">byEli</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/eli"
              aria-label="Sesiones con Eli"
              title="Sesiones con Eli"
              className="rounded-full transition-transform duration-300 hover:scale-105 active:scale-95"
              onClick={() => haptic(6)}
            >
              <EliAvatar size={40} />
            </Link>
            <IconButton label={sceneSound ? 'Silenciar escena' : 'Escuchar la escena'} onClick={toggleSceneSound}>
              {sceneSound ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
            </IconButton>
            <IconButton label="Cambiar escena" onClick={() => setScenesOpen(true)}>
              <Mountain className="size-[18px]" />
            </IconButton>
          </div>
        </div>
        <motion.div
          className="absolute inset-x-0 bottom-24 mx-auto max-w-5xl px-5 md:px-8 lg:bottom-24 lg:px-10"
          style={reduced ? undefined : { opacity: greetingOpacity, y: greetingY }}
        >
          <motion.div variants={stagger(0.12, 0.15)} initial="hidden" animate="show" className="[text-shadow:0_2px_20px_rgb(3_40_50/0.55)]">
            <motion.p variants={reveal} className="text-[13px] font-semibold tracking-wide text-2">{longDate(now)}</motion.p>
            <h1 className="mt-1.5 font-display text-[40px] leading-[1.02] md:text-[56px] lg:text-[64px]">
              <Words text={`${greeting(now)}${name ? `, ${name}` : ''}`} delay={0.27} />
            </h1>
            <motion.p variants={reveal} className="mt-2 flex items-center gap-2 text-[14px] text-2">
              Un momento para vos. A tu ritmo.
            </motion.p>
          </motion.div>
        </motion.div>
      </section>

      <motion.div variants={sections} initial="hidden" animate="show" className="relative z-10 mx-auto -mt-16 max-w-5xl space-y-12 md:px-8 lg:px-10">
        <div className="space-y-10 lg:grid lg:grid-cols-[1.3fr_1fr] lg:items-start lg:gap-6 lg:space-y-0">
          <motion.section variants={reveal} className="px-5 md:px-0">
            <HeroSessionCard session={daily} eyebrow="La pausa del día" note={daily.daily?.theme} />
          </motion.section>

          <div className="space-y-10 lg:space-y-5">
            <motion.section variants={reveal} className="px-5 md:px-0">
              <CheckInCard todayMood={todayMood} />
            </motion.section>

            <motion.section variants={reveal}>
              <div className="grid grid-cols-4 gap-2.5 px-5 md:px-0">
                <Tool to="/respirar" icon={<Wind className="size-6" />} label="Respirar" />
                <Tool to="/temporizador" icon={<Timer className="size-6" />} label="Temporizador" />
                <Tool to="/dormir" icon={<Moon className="size-6" />} label="Dormir" />
                <Tool icon={<LifeBuoy className="size-6" />} label="SOS" onClick={() => usePlayer.getState().playSession('sos-ansiedad')} />
              </div>
            </motion.section>
          </div>
        </div>

        <motion.section variants={reveal} className="px-5 md:px-0">
          {active ? (
            <ContinueCard progress={active} />
          ) : !suggestedProgress.complete ? (
            <StartProgram progress={suggestedProgress} />
          ) : null}
        </motion.section>

        <motion.section variants={reveal}>
          <SectionTitle title="Para vos" action={<SeeAll to="/meditar" />} />
          <Rail>
            {forYou.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </Rail>
        </motion.section>

        <motion.section variants={reveal} className="px-5 md:px-0 lg:max-w-2xl">
          <EliHomeCard />
        </motion.section>

        <motion.section variants={reveal}>
          <SectionTitle title={part.title} />
          <Rail>
            {part.sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </Rail>
        </motion.section>

        <motion.section variants={reveal} className="px-5 md:px-0">
          <QuoteCard text={quote.text} author={quote.author} />
        </motion.section>

        <details className="group mx-5 border-t border-white/10 py-5 md:mx-0">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl py-2 text-[14px] font-semibold text-2 transition-colors hover:text-mist-50 [&::-webkit-details-marker]:hidden">
            Tu semana, sin exigencias
            <ChevronDown className="size-4 transition-transform duration-300 group-open:rotate-180" />
          </summary>
          <div className="mt-4">
            <WeekCard />
          </div>
        </details>
      </motion.div>

      <Sheet open={scenesOpen} onClose={() => setScenesOpen(false)} title="Escena de inicio" size="lg">
        <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3">
          {sceneChoices.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === sceneId}
              onClick={() => {
                haptic(6);
                updateSettings({ sceneId: s.id });
              }}
              className="group text-left"
            >
              <div
                className={cn(
                  'relative aspect-[3/4] overflow-hidden rounded-3xl ring-2 transition-all duration-300',
                  s.id === sceneId ? 'ring-coral-400' : 'ring-transparent group-hover:ring-white/25',
                )}
              >
                <ScenePreview sceneId={s.preview} />
                {s.id === sceneId && (
                  <span className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-coral text-ink-950">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="mt-2 text-[14px] leading-snug font-semibold">{s.name}</p>
              {s.note && <p className="text-[12.5px] leading-snug text-3">{s.note}</p>}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function ScenePreview({ sceneId }: { sceneId: SceneId }) {
  const s = SCENE_BY_ID[sceneId];
  const motif = s.motif ??
    ({ lake: 'lake', forest: 'forest', ocean: 'waves', aurora: 'aurora', campfire: 'flame', snow: 'cabin', desert: 'dunes', valley: 'path' } as const)[s.layout];
  return <Landscape spec={{ palette: s.palette, motif, seed: s.seed }} ratio={0.75} uid={`pv-${sceneId}`} />;
}

function Tool({ to, icon, label, onClick }: { to?: string; icon: ReactNode; label: string; onClick?: () => void }) {
  const navigate = useNavigate();
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      transition={SPRING_PRESS}
      onClick={() => {
        haptic(6);
        if (onClick) onClick();
        else if (to) navigate(to);
      }}
      className="glass flex flex-col items-center gap-2 rounded-3xl px-1 py-4 transition-colors hover:bg-white/10"
    >
      <span className="text-mist-50/90">{icon}</span>
      <span className="text-[11.5px] font-medium min-[380px]:text-[12px]">{label}</span>
    </motion.button>
  );
}

function SeeAll({ to }: { to: string }) {
  return (
    <Link to={to} className="flex items-center gap-1 text-[13px] font-semibold text-2 transition-colors hover:text-mist-50">
      Ver todo <ArrowRight className="size-3.5" />
    </Link>
  );
}

function CheckInCard({ todayMood }: { todayMood?: MoodEntry }) {
  const open = useUI((s) => s.openCheckIn);
  if (todayMood) {
    const m = MOODS[todayMood.level - 1]!;
    const labels = todayMood.feelings
      .map((f) => FEELINGS.find((x) => x.id === f)?.label)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
    return (
      <div className="glass flex items-center gap-4 rounded-[28px] p-4">
        <MoodOrb level={todayMood.level} size={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold tracking-[0.12em] text-3 uppercase">Hoy te sentís</p>
          <p className="truncate text-[16px] font-semibold">
            {m.label}
            {labels ? ` · ${labels}` : ''}
          </p>
        </div>
        <Link to="/diario" className="rounded-full bg-white/8 px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-white/14">
          Diario
        </Link>
      </div>
    );
  }
  return (
    <div className="glass rounded-[28px] p-5">
      <p className="font-display text-[21px] leading-tight">¿Cómo te sentís hoy?</p>
      <p className="mt-1 text-[13.5px] text-3">Un registro de diez segundos. Tu diario te lo va a agradecer.</p>
      <div className="mt-4 flex justify-between">
        {MOODS.map((m) => (
          <button
            key={m.level}
            type="button"
            className="group flex flex-col items-center gap-1.5"
            onClick={() => {
              haptic(8);
              open(true, m.level);
            }}
            aria-label={m.label}
          >
            <span className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
              <MoodOrb level={m.level} size={42} />
            </span>
            <span className="text-[11px] text-3">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StartProgram({ progress }: { progress: ReturnType<typeof programProgress> }) {
  return (
    <div>
      <p className="mb-3 font-display text-[22px] md:text-[26px]">{progress.done.length ? 'Seguí con tu programa' : 'Empezá por acá'}</p>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <ProgramCard progress={progress} className="md:shrink-0" />
        <p className="max-w-sm text-[15px] leading-relaxed text-2">{progress.program.outcome} {progress.program.description.split('.')[0]}.</p>
      </div>
    </div>
  );
}

function QuoteCard({ text, author }: { text: string; author?: string }) {
  return (
    <figure className="relative overflow-hidden rounded-[30px] border border-white/8 bg-gradient-to-br from-ink-700/60 to-ink-800/40 px-6 py-8 md:px-10 md:py-10">
      <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-blush-400/15 blur-3xl" />
      <p className="text-[12px] font-bold tracking-[0.16em] text-3 uppercase">Frase del día</p>
      <blockquote className="mt-3 font-display text-[25px] leading-snug italic md:text-[30px]">“{text}”</blockquote>
      <figcaption className="mt-4 flex items-center justify-between">
        <span className="text-[14px] text-2">{author ?? 'CalmabyEli'}</span>
        <IconButton
          label="Compartir frase"
          size="sm"
          variant="plain"
          onClick={async () => {
            const r = await shareOrCopy({ title: 'Frase del día', text: `“${text}”${author ? ` — ${author}` : ''}` });
            if (r === 'copied') useUI.getState().toast('Frase copiada');
          }}
        >
          <Share2 className="size-4" />
        </IconButton>
      </figcaption>
    </figure>
  );
}

function WeekCard() {
  const history = useAppStore((s) => s.history);
  const week = currentWeek();
  const perDay = useMemo(() => minutesByDay(history), [history]);
  const total = week.reduce((acc, d) => acc + (perDay.get(d) ?? 0), 0);
  const today = dayKey();
  return (
    <Link to="/perfil" className="glass block rounded-[28px] p-5 transition-colors hover:bg-white/8">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-[21px]">Tu semana</p>
        <p className="text-[13px] text-2">{Math.round(total)} min</p>
      </div>
      <div className="mt-4 flex justify-between">
        {week.map((d) => {
          const mins = perDay.get(d) ?? 0;
          const done = mins >= 1;
          return (
            <div key={d} className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-full text-[12px] font-semibold transition-colors',
                  done ? 'bg-mist-50 text-ink-900' : 'bg-white/6 text-mist-50/80',
                  d === today && !done && 'ring-1 ring-mist-50/50',
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : fromDayKey(d).getDate()}
              </span>
              <span className={cn('text-[11px] font-semibold', d === today ? 'text-mist-50' : 'text-3')}>{shortWeekday(fromDayKey(d))}</span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
