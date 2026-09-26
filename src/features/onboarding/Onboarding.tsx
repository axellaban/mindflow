import { ArrowLeft, ArrowRight, Bed, Brain, CalendarPlus, Feather, Heart, Moon, Mountain, Sprout, Waves, Wind } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { engine } from '@/audio/engine';
import { CoverArt } from '@/art/CoverArt';
import { Scene } from '@/art/Scene';
import { LogoMark } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/controls';
import { PROGRAM_BY_ID, SESSION_BY_ID } from '@/content/catalog';
import { ELI } from '@/content/eli';
import { GOALS as GOAL_DEFS } from '@/content/goals';
import { suggestedProgram } from '@/content/recommend';
import { SCENE_BY_ID } from '@/content/scenes';
import type { GoalId } from '@/content/types';
import { downloadFile, haptic, reminderICS } from '@/lib/device';
import { EliAvatar } from '@/features/eli/EliAvatar';
import { formatDuration } from '@/lib/time';
import { EASE, SPRING_PRESS, breath } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { type Profile, useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';
import { BreathIntro } from './BreathIntro';

const GOAL_ICONS: Record<GoalId, ReactNode> = {
  estres: <Wind className="size-5" />,
  mente: <Brain className="size-5" />,
  autoexigencia: <Mountain className="size-5" />,
  descanso: <Bed className="size-5" />,
  culpa: <Feather className="size-5" />,
  ansiedad: <Waves className="size-5" />,
  dormir: <Moon className="size-5" />,
  autocuidado: <Heart className="size-5" />,
  aprender: <Sprout className="size-5" />,
};
const GOALS = GOAL_DEFS.map((g) => ({ ...g, icon: GOAL_ICONS[g.id] }));

const EXPERIENCE: Array<{ id: NonNullable<Profile['experience']>; label: string; hint: string }> = [
  { id: 'nuevo', label: 'Nunca', hint: 'Es mi primera vez' },
  { id: 'algo', label: 'Un poco', hint: 'Lo probé algunas veces' },
  { id: 'regular', label: 'Con regularidad', hint: 'Ya tengo una práctica' },
];

const TIMES = [
  { label: 'Al despertar', time: '08:00' },
  { label: 'Al mediodía', time: '13:00' },
  { label: 'Antes de dormir', time: '21:30' },
];

const panel = {
  initial: { opacity: 0, y: 24, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -16, filter: 'blur(6px)' },
  transition: { duration: 0.8, ease: EASE },
};

export function Onboarding() {
  const navigate = useNavigate();
  const complete = useAppStore((s) => s.completeOnboarding);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [intro, setIntro] = useState(true);
  const endIntro = useCallback(() => setIntro(false), []);
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<GoalId[]>([]);
  const [experience, setExperience] = useState<Profile['experience']>(null);
  const [name, setName] = useState('');
  const [time, setTime] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (!usePlayer.getState().item) {
        engine.stopAll(2);
        engine.releaseKeepAlive();
      }
    },
    [],
  );

  const next = () => {
    haptic(6);
    setStep((s) => s + 1);
  };

  const begin = () => {
    next();
  };

  const tryPractice = () => {
    complete({ name: name.trim(), goals, experience: experience ?? 'nuevo' });
    usePlayer.getState().playSession('pausa-3-minutos');
    navigate('/', { replace: true });
  };

  const profile: Profile = { name, goals, experience, createdAt: Date.now(), onboarded: true };
  const program = suggestedProgram(profile);
  const first = experience === 'nuevo' ? SESSION_BY_ID['primera-meditacion']! : SESSION_BY_ID[program.sessions[0]!]!;

  const finish = (play: boolean) => {
    complete({ name: name.trim(), goals, experience });
    if (time) updateSettings({ reminderTime: time });
    // start audio synchronously, inside the tap (required by mobile autoplay rules)
    if (play) usePlayer.getState().playSession(first.id);
    else engine.stopAll(1.2);
    navigate('/', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[65] overflow-hidden bg-ink-900">
      {/* Alive while breathing; afterwards a still, soft backdrop. */}
      <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, ease: 'easeOut' }}>
        <div
          className="absolute inset-0 transition-[opacity,filter] duration-[1600ms] ease-out"
          style={intro ? undefined : { opacity: 0.3, filter: 'blur(20px)' }}
        >
          <Scene scene={SCENE_BY_ID.playa} paused={!intro} />
        </div>
      </motion.div>
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/10 via-transparent to-ink-950/45 transition-opacity duration-[1600ms]', !intro && 'opacity-0')} />
      <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/65 to-ink-900 transition-opacity duration-[1600ms]', intro && 'opacity-0')} />

      <AnimatePresence mode="wait">
        {intro ? (
          <BreathIntro key="intro" onDone={endIntro} />
        ) : (
          <div key="steps" className="absolute inset-0">
            {step > 0 && (
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-ink-900 via-ink-900/85 to-transparent px-4 pt-safe pb-3">
                <button type="button" aria-label="Volver al paso anterior" onClick={() => setStep((s) => Math.max(0, s - 1))} className="flex size-11 items-center justify-center rounded-full hover:bg-white/10"><ArrowLeft className="size-5" /></button>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={cn('h-1 rounded-full transition-all duration-500', i <= step ? 'w-6 bg-mist-50' : 'w-3 bg-white/25')} />
                  ))}
                </div>
                <button type="button" onClick={() => finish(false)} className="min-h-11 px-3 text-sm text-2">Ir al inicio</button>
              </div>
            )}

            <div className={cn('relative mx-auto flex h-full max-w-lg flex-col px-6 pb-safe', step === 0 ? 'pt-safe' : 'overflow-y-auto pt-[calc(max(12px,var(--safe-top))+68px)]')}>
              <AnimatePresence mode="wait">
                {step === 0 && <Welcome key="w" onBegin={begin} onTry={tryPractice} />}

                {step === 1 && <MeetEli key="eli" onNext={next} />}

                {step === 2 && (
                  <motion.div key="goals" {...panel} className="pb-4">
                    <h1 className="font-display text-[32px] leading-tight">¿Qué es lo que más te cuesta hoy?</h1>
                    <p className="mt-2 text-[15px] text-2">Elegí todo lo que resuene. Con esto armamos tu práctica.</p>
                    <div className="mt-6 grid grid-cols-2 gap-2.5">
                      {GOALS.map((g) => {
                        const on = goals.includes(g.id);
                        return (
                          <motion.button
                            key={g.id}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            transition={SPRING_PRESS}
                            onClick={() => {
                              haptic(6);
                              setGoals((xs) => (on ? xs.filter((x) => x !== g.id) : [...xs, g.id]));
                            }}
                            className={cn(
                              'flex items-center gap-3 rounded-3xl border px-4 py-3.5 text-left text-[14.5px] font-semibold backdrop-blur-xl transition-all duration-300',
                              on ? 'border-mist-50 bg-mist-50 text-ink-900' : 'border-white/12 bg-ink-900/35 text-mist-50 hover:bg-ink-900/50',
                              g.id === 'aprender' && 'col-span-2 justify-center',
                            )}
                            aria-pressed={on}
                          >
                            {g.icon}
                            {g.label}
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="mt-6 flex gap-2.5">
                      <Button variant="ghost" onClick={next}>
                        Omitir
                      </Button>
                      <Button full size="lg" onClick={next} disabled={!goals.length}>
                        Continuar
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="exp" {...panel} className="pb-4">
                    <h1 className="font-display text-[34px] leading-tight">¿Meditaste alguna vez?</h1>
                    <p className="mt-2 text-[15px] text-2">No hay respuesta correcta. Nos ayuda a elegir por dónde empezar.</p>
                    <div className="mt-6 space-y-2.5">
                      {EXPERIENCE.map((e) => (
                        <motion.button
                          key={e.id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          transition={SPRING_PRESS}
                          onClick={() => {
                            setExperience(e.id);
                            setTimeout(next, 180);
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-3xl border px-5 py-4 text-left backdrop-blur-xl transition-all duration-300',
                            experience === e.id ? 'border-mist-50 bg-mist-50 text-ink-900' : 'border-white/12 bg-ink-900/35 hover:bg-ink-900/50',
                          )}
                        >
                          <span>
                            <span className="block text-[16px] font-semibold">{e.label}</span>
                            <span className={cn('block text-[13px]', experience === e.id ? 'text-ink-900/60' : 'text-3')}>{e.hint}</span>
                          </span>
                          <ArrowRight className="size-4 opacity-60" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="name" {...panel} className="pb-4">
                    <h1 className="font-display text-[34px] leading-tight">¿Cómo te llamás?</h1>
                    <p className="mt-2 text-[15px] text-2">Para saludarte por tu nombre. Queda solo en tu dispositivo.</p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        next();
                      }}
                    >
                      <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value.slice(0, 40))}
                        placeholder="Tu nombre"
                        autoComplete="given-name"
                        className="mt-6 h-14 w-full rounded-3xl border border-white/15 bg-ink-900/45 px-5 text-[18px] outline-none backdrop-blur-xl placeholder:text-mist-50/35 focus:border-mist-50/60"
                      />
                      <div className="mt-5 flex gap-2.5">
                        <Button variant="ghost" onClick={next}>
                          Omitir
                        </Button>
                        <Button type="submit" full size="lg" disabled={!name.trim()}>
                          Continuar
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div key="plan" {...panel} className="pb-4">
                    <p className="text-[12px] font-bold tracking-[0.16em] text-2 uppercase">Tu plan</p>
                    <h1 className="mt-1 font-display text-[32px] leading-tight">Todo listo{name.trim() ? `, ${name.trim().split(' ')[0]}` : ''}</h1>
                    <p className="mt-2 text-[15px] text-2">Te propongo empezar así:</p>

                    <div className="mt-5 space-y-2.5">
                      <PlanItem art={<CoverArt spec={first.art} rounded="rounded-2xl" className="size-14" grain={false} />} eyebrow="Hoy" title={first.title} meta={`${formatDuration(first.duration)} · ${first.subtitle}`} />
                      <PlanItem
                        art={<CoverArt spec={program.art} rounded="rounded-2xl" className="size-14" grain={false} />}
                        eyebrow="Después"
                        title={PROGRAM_BY_ID[program.id].title}
                        meta={program.subtitle}
                      />
                    </div>

                    <div className="mt-6">
                      <p className="text-[15px] font-semibold">¿Cuándo querés tu momento de calma?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {TIMES.map((t) => (
                          <Chip key={t.time} active={time === t.time} onClick={() => setTime(time === t.time ? null : t.time)} className="backdrop-blur-xl">
                            {t.label}
                          </Chip>
                        ))}
                      </div>
                      <AnimatePresence>
                        {time && (
                          <motion.button
                            type="button"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            onClick={() => {
                              downloadFile('mindfulness-recordatorio.ics', reminderICS(time, location.origin), 'text/calendar');
                              useUI.getState().toast('Abrí el archivo para agregarlo a tu calendario');
                            }}
                            className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-blush-300"
                          >
                            <CalendarPlus className="size-4" /> Agregar un recordatorio diario a mi calendario ({time})
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mt-7 flex flex-col gap-2.5">
                      <Button full size="lg" onClick={() => finish(true)}>
                        Empezar ahora
                      </Button>
                      <Button full variant="secondary" size="lg" onClick={() => finish(false)}>
                        Explorar primero
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanItem({ art, eyebrow, title, meta }: { art: ReactNode; eyebrow: string; title: string; meta: string }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-ink-900/45 p-3 backdrop-blur-xl">
      <div className="shrink-0">{art}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-[0.14em] text-3 uppercase">{eyebrow}</p>
        <p className="truncate text-[16px] font-semibold">{title}</p>
        <p className="truncate text-[13px] text-3">{meta}</p>
      </div>
    </div>
  );
}

function Welcome({ onBegin, onTry }: { onBegin: () => void; onTry: () => void }) {
  return (
    <motion.div {...panel} className="flex h-full min-h-0 flex-col items-center justify-between overflow-y-auto py-6 text-center">
      <p className="pt-5 text-xs tracking-[0.18em] text-2 uppercase">Mindfulness con Eli</p>
      <div className="my-8 flex flex-col items-center">
        <LogoMark className="mb-8 size-12" />
        <h1 className="font-display text-[48px] leading-tight sm:text-[60px]">Calma<span className="italic text-blush-300">byEli</span></h1>
        <p className="mt-5 font-display text-[28px] leading-snug">Un momento para vos.</p>
        <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-2">Prácticas guiadas para bajar un cambio, descansar y volver a lo que sentís.</p>
        <div className="mt-8 flex items-center gap-3 text-left">
          <EliAvatar size={40} halo={false} />
          <p className="text-sm text-2">Con Eli Curcio<br /><span className="text-xs text-3">Profesora de mindfulness</span></p>
        </div>
      </div>
      <div className="w-full space-y-3 pb-2">
        <Button full size="lg" onClick={onTry}>Probar una pausa</Button>
        <Button full variant="ghost" onClick={onBegin}>Personalizar mi espacio</Button>
        <p className="text-xs leading-relaxed text-3">Sin cuenta ni contraseña.<br />Tu progreso se guarda en este dispositivo.</p>
      </div>
    </motion.div>
  );
}

/** Eli introduces herself: the person behind the app, before any question. */
function MeetEli({ onNext }: { onNext: () => void }) {
  return (
    <motion.div {...panel} className="flex flex-col pb-6">
      <div className="relative mx-auto w-32 shrink-0 sm:w-40">
        <motion.div
          aria-hidden="true"
          className="absolute -inset-6 rounded-[44px] bg-[radial-gradient(closest-side,rgb(168_220_213/0.4),transparent)] blur-xl"
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.97, 1.04, 0.97] }}
          transition={breath}
        />
        <motion.img
          src={ELI.photo}
          alt={ELI.fullName}
          className="relative aspect-[4/5] w-full rounded-[32px] border border-white/15 object-cover shadow-[0_30px_60px_-24px_rgb(0_0_0/0.7)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
        />
        <div className="absolute -right-4 -bottom-3 rotate-[4deg] rounded-full bg-mist-50 px-3.5 py-1.5 font-display text-[19px] font-semibold text-ink-900 italic shadow-lg">
          Hola, soy Eli
        </div>
      </div>
      <h1 className="mt-9 font-display text-[30px] leading-tight">Este espacio es para vos</h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-2">
        Soy Eli, profesora de mindfulness. Te acompaño a hacer una pausa en medio de todo lo que tenés que resolver.
      </p>
      <p className="mt-3 text-[15.5px] leading-relaxed text-2">
        Podemos empezar de a poco. Estas preguntas son opcionales y me ayudan a sugerirte por dónde seguir.
      </p>
      <p className="mt-3 font-display text-[20px] text-blush-300 italic">Eli</p>
      <div className="mt-6 flex items-center gap-3">
        <Button full size="lg" onClick={onNext} icon={<ArrowRight className="order-last size-5" />}>
          Empecemos
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-3">
        <EliAvatar size={18} halo={false} /> Primero, contame un poco de vos
      </div>
    </motion.div>
  );
}
