import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { BreathTone } from '@/audio/bells';
import { engine } from '@/audio/engine';
import { PALETTES } from '@/art/palettes';
import { Scene } from '@/art/Scene';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/controls';
import { Words } from '@/components/ui/Words';
import { BREATH_BY_ID, BREATH_PATTERNS, type BreathPattern, type PhaseKind, cycleSeconds } from '@/content/breathing';
import { beachAt } from '@/content/scenes';
import { haptic, keepAwake } from '@/lib/device';
import { useBack } from '@/lib/hooks';
import { EASE, breath, press } from '@/lib/motion';
import { formatClock } from '@/lib/time';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';
import { BreathCircle, BreathWord, ClosedCircle } from './BreathCircle';

const MINUTES = [1, 2, 3, 5, 10];
const MIN_SCALE = 0.56;
const TARGET: Record<PhaseKind, number | null> = { in: 1, in2: 1.1, out: MIN_SCALE, hold: null, rest: null };

type Stage = 'setup' | 'run' | 'done';

export function BreatheScreen() {
  const settings = useAppStore((s) => s.settings.breathe);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [search] = useSearchParams();
  const requested = search.get('patron');
  const [patternId, setPatternId] = useState(
    requested && requested in BREATH_BY_ID ? requested : settings.patternId in BREATH_BY_ID ? settings.patternId : 'coherencia',
  );
  const [minutes, setMinutes] = useState(settings.minutes);
  const [sound, setSound] = useState(settings.sound);
  const [stage, setStage] = useState<Stage>('setup');
  const [result, setResult] = useState<{ seconds: number; cycles: number } | null>(null);
  const pattern = BREATH_BY_ID[patternId]!;
  const [scene] = useState(() => beachAt());

  const exit = useBack();

  const start = () => {
    updateSettings({ breathe: { patternId, minutes, sound } });
    usePlayer.getState().close();
    engine.unlock(true);
    setStage('run');
  };

  const breathing = stage === 'run';
  return (
    <main className="fixed inset-0 z-[65] overflow-hidden bg-ink-900">
      {/* the beach as it looks now: soft behind the choices, clear while breathing */}
      <div
        className="absolute inset-0 transition-[filter,opacity] duration-[1400ms] ease-out"
        style={breathing ? undefined : { filter: 'blur(18px)', opacity: 0.6 }}
      >
        <Scene scene={scene} paused={!breathing} />
      </div>
      <div className={cn('pointer-events-none absolute inset-0 transition-colors duration-[1400ms]', breathing ? 'bg-ink-950/10' : 'bg-ink-950/50')} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink-950/70 to-transparent" />
      <AnimatePresence mode="wait">
        {stage === 'setup' && (
          <Setup
            key="setup"
            pattern={pattern}
            minutes={minutes}
            sound={sound}
            onPattern={setPatternId}
            onMinutes={setMinutes}
            onSound={setSound}
            onStart={start}
            onClose={exit}
          />
        )}
        {stage === 'run' && (
          <Runner
            key="run"
            pattern={pattern}
            minutes={minutes}
            sound={sound}
            onSound={setSound}
            onFinish={(r) => {
              setResult(r);
              setStage('done');
            }}
            onClose={exit}
          />
        )}
        {stage === 'done' && result && (
          <Done key="done" pattern={pattern} result={result} onAgain={() => setStage('run')} onClose={exit} />
        )}
      </AnimatePresence>
    </main>
  );
}

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.8, ease: EASE },
};

function Setup({
  pattern,
  minutes,
  sound,
  onPattern,
  onMinutes,
  onSound,
  onStart,
  onClose,
}: {
  pattern: BreathPattern;
  minutes: number;
  sound: boolean;
  onPattern: (id: string) => void;
  onMinutes: (m: number) => void;
  onSound: (v: boolean) => void;
  onStart: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div {...fade} className="relative mx-auto flex h-full max-w-3xl flex-col pt-safe pb-safe">
      <div className="flex items-center justify-between px-5 py-2">
        <IconButton label="Cerrar" onClick={onClose}>
          <X className="size-5" />
        </IconButton>
        <IconButton label={sound ? 'Desactivar sonido guía' : 'Activar sonido guía'} onClick={() => onSound(!sound)}>
          {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </IconButton>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="px-5 pt-4 text-center">
          <p className="text-[12px] font-bold tracking-[0.16em] text-2 uppercase">Respirar</p>
          <h1 className="mt-2 font-display text-[36px] leading-tight md:text-[44px]">Encontrá tu ritmo</h1>
          <p className="mx-auto mt-2 max-w-sm text-[15px] text-2">Unos minutos de respiración consciente cambian cómo se siente tu cuerpo.</p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-2.5 px-5 sm:grid-cols-2">
          {BREATH_PATTERNS.map((p) => {
            const active = p.id === pattern.id;
            const pal = PALETTES[p.palette];
            return (
              <motion.button
                key={p.id}
                type="button"
                {...press}
                aria-pressed={active}
                onClick={() => {
                  haptic(6);
                  onPattern(p.id);
                }}
                className={cn(
                  'flex items-center gap-4 rounded-3xl border p-4 text-left transition-all duration-400',
                  active ? 'border-white/30 bg-white/12' : 'border-white/6 bg-white/4 hover:bg-white/8',
                )}
              >
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `radial-gradient(circle at 35% 30%, ${pal.accent[0]}, ${pal.sky[1]})` }}
                >
                  <span className="size-3 rounded-full bg-white/80" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[16px] font-semibold">{p.name}</span>
                    <span className="text-[13px] font-semibold text-2 tabular-nums">{p.short}</span>
                  </span>
                  <span className="block text-[13px] text-3">{p.benefit}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={pattern.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto mt-5 max-w-lg px-6 text-center text-[14px] leading-relaxed text-2"
          >
            {pattern.description}
          </motion.p>
        </AnimatePresence>

        <div className="mt-7 px-5 text-center">
          <p className="mb-3 text-[13px] font-semibold text-3">Duración</p>
          <div className="flex flex-wrap justify-center gap-2">
            {MINUTES.map((m) => (
              <Chip key={m} active={m === minutes} onClick={() => onMinutes(m)}>
                {m} min
              </Chip>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 pt-4">
        <Button full size="lg" onClick={onStart} className="mx-auto max-w-md">
          Comenzar
        </Button>
      </div>
    </motion.div>
  );
}

function Runner({
  pattern,
  minutes,
  sound,
  onSound,
  onFinish,
  onClose,
}: {
  pattern: BreathPattern;
  minutes: number;
  sound: boolean;
  onSound: (v: boolean) => void;
  onFinish: (r: { seconds: number; cycles: number }) => void;
  onClose: () => void;
}) {
  const total = minutes * 60;
  const scale = useMotionValue(MIN_SCALE);
  const turn = useMotionValue(0);
  const cycle = cycleSeconds(pattern);
  // where each phase starts in the cycle, for the marks on the ring
  const starts = useMemo(() => {
    let acc = 0;
    return pattern.phases.map((ph) => {
      const at = acc;
      acc += ph.seconds;
      return at;
    });
  }, [pattern]);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [countIn, setCountIn] = useState(2);
  const toneRef = useRef<BreathTone | null>(null);
  const state = useRef({ elapsed: 0, phase: 0, phaseT: 0, from: MIN_SCALE, cycles: 0, last: 0 });
  const logPractice = useAppStore((s) => s.logPractice);

  const finish = useCallback(
    (completed: boolean) => {
      const secs = Math.round(state.current.elapsed);
      const fresh = logPractice({ kind: 'breathe', refId: pattern.id, title: pattern.name, at: Date.now() - secs * 1000, seconds: secs, completed });
      if (fresh.length) useUI.getState().celebrate(fresh);
      return { seconds: secs, cycles: state.current.cycles };
    },
    [logPractice, pattern],
  );

  // a short moment to settle before the first breath
  useEffect(() => {
    if (countIn <= 0) return;
    const t = setTimeout(() => setCountIn((c) => c - 1), 1400);
    return () => clearTimeout(t);
  }, [countIn]);

  // audio + wake lock lifetime; updates wait until the practice is over
  useEffect(() => {
    void keepAwake(true);
    useUI.getState().setPracticing(true);
    engine.bell('cuenco', 0.35);
    return () => {
      void keepAwake(false);
      useUI.getState().setPracticing(false);
      toneRef.current?.dispose();
      toneRef.current = null;
      engine.releaseKeepAlive();
    };
  }, []);

  useEffect(() => {
    if (sound && !toneRef.current && countIn <= 0) {
      toneRef.current = engine.breathTone();
      const ph = pattern.phases[state.current.phase]!;
      toneRef.current.phase(ph.kind, ph.seconds);
    }
    if (!sound && toneRef.current) {
      toneRef.current.dispose();
      toneRef.current = null;
    }
  }, [sound, countIn, pattern]);

  useEffect(() => {
    if (countIn > 0 || paused) return;
    let raf = 0;
    const s = state.current;
    s.last = performance.now();
    const enterPhase = (idx: number) => {
      const ph = pattern.phases[idx]!;
      s.phase = idx;
      s.phaseT = 0;
      s.from = scale.get();
      setPhaseIdx(idx);
      toneRef.current?.phase(ph.kind, ph.seconds);
      haptic(ph.kind === 'in' ? 18 : ph.kind === 'out' ? [10, 60, 10] : 8);
    };
    if (s.elapsed === 0) enterPhase(0);
    else {
      const ph = pattern.phases[s.phase]!;
      toneRef.current?.phase(ph.kind, Math.max(0.5, ph.seconds - s.phaseT));
    }
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - s.last) / 1000);
      s.last = now;
      s.elapsed += dt;
      s.phaseT += dt;
      const ph = pattern.phases[s.phase]!;
      const k = Math.min(1, s.phaseT / ph.seconds);
      const target = TARGET[ph.kind];
      if (target !== null) {
        const e = 0.5 - 0.5 * Math.cos(Math.PI * k);
        scale.set(s.from + (target - s.from) * e);
      } else {
        scale.set(s.from * (1 + 0.012 * Math.sin(s.phaseT * 3)));
      }
      turn.set((starts[s.phase]! + Math.min(s.phaseT, ph.seconds)) / cycle);
      if (Math.floor(s.elapsed * 4) !== Math.floor((s.elapsed - dt) * 4)) setElapsed(s.elapsed);
      if (s.phaseT >= ph.seconds) {
        const nextIdx = (s.phase + 1) % pattern.phases.length;
        if (nextIdx === 0) {
          s.cycles++;
          // end only at a cycle boundary, never mid-breath
          if (s.elapsed >= total - 0.5) {
            engine.bell('cuenco', 0.4);
            onFinish(finish(true));
            return;
          }
        }
        enterPhase(nextIdx);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [countIn, paused, pattern, scale, turn, starts, cycle, total, finish, onFinish]);

  const phase = pattern.phases[phaseIdx]!;
  const remaining = Math.max(0, total - elapsed);

  return (
    <motion.div {...fade} className="relative flex h-full flex-col items-center pt-safe pb-safe">
      <div className="flex w-full max-w-3xl items-center justify-between px-5 py-2">
        <IconButton
          label="Terminar"
          onClick={() => {
            if (state.current.elapsed > 20) {
              onFinish(finish(false));
            } else onClose();
          }}
        >
          <X className="size-5" />
        </IconButton>
        <p className="font-display text-[17px] font-semibold text-2 tabular-nums">{formatClock(remaining)}</p>
        <IconButton label={sound ? 'Silenciar guía' : 'Activar guía'} onClick={() => onSound(!sound)}>
          {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </IconButton>
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center">
        {/* screen readers hear each phase as it begins */}
        <p className="sr-only" aria-live="polite">
          {countIn > 0 ? 'Acomodate' : phase.label}
        </p>
        <BreathCircle scale={scale} turn={turn} marks={starts.map((at) => at / cycle)}>
          <BreathWord
            silent
            word={countIn > 0 ? 'acomodate' : phase.label.toLowerCase()}
            id={countIn > 0 ? 'settle' : `${phaseIdx}-${phase.label}`}
            className="text-[clamp(24px,8vw,32px)] font-normal tracking-[0.02em] text-white [text-shadow:0_1px_2px_rgb(2_38_48/0.3),0_0_18px_rgb(2_38_48/0.45)]"
          />
        </BreathCircle>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-5 px-6 pb-4">
        <div className="text-center">
          <p className="text-[14px] text-2">
            {pattern.name} · <span className="tabular-nums">{pattern.short}</span>
          </p>
          <p className="mt-0.5 text-[12.5px] text-3">
            {new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(60 / cycle)} respiraciones por minuto
          </p>
        </div>
        <motion.button
          type="button"
          {...press}
          onClick={() => {
            haptic(8);
            setPaused((p) => !p);
            if (!paused) toneRef.current?.phase('rest', 1);
          }}
          aria-label={paused ? 'Continuar' : 'Pausar'}
          className="flex size-16 items-center justify-center rounded-full bg-white/12 backdrop-blur-xl transition-colors hover:bg-white/18"
        >
          {paused ? <Play className="ml-1 size-6 fill-current" /> : <Pause className="size-6 fill-current" />}
        </motion.button>
      </div>
    </motion.div>
  );
}

function Done({
  pattern,
  result,
  onAgain,
  onClose,
}: {
  pattern: BreathPattern;
  result: { seconds: number; cycles: number };
  onAgain: () => void;
  onClose: () => void;
}) {
  const minutes = Math.max(1, Math.round(result.seconds / 60));
  const lines = useMemo(
    () => ['Tu cuerpo ya lo nota.', 'Llevá este ritmo con vos.', 'Una pausa bien aprovechada.', 'Respirar es volver a casa.'],
    [],
  );
  const line = lines[result.cycles % lines.length];
  return (
    <motion.div {...fade} className="relative mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 pt-safe pb-safe text-center">
      <motion.div className="mb-9" animate={{ scale: [1, 1.06, 1] }} transition={breath}>
        <ClosedCircle className="size-28" />
      </motion.div>
      <p className="text-[13px] font-bold tracking-[0.16em] text-2 uppercase">Práctica completada</p>
      <h2 className="mt-2 font-display text-[36px] leading-tight">
        <Words text={line!} delay={0.2} />
      </h2>
      <p className="mt-3 text-[15px] text-2">
        {minutes} {minutes === 1 ? 'minuto' : 'minutos'} · {result.cycles} {result.cycles === 1 ? 'ciclo' : 'ciclos'} de {pattern.name.toLowerCase()}
      </p>
      <div className="mt-10 flex w-full flex-col gap-2.5">
        <Button full size="lg" onClick={onClose}>
          Listo
        </Button>
        <Button full size="lg" variant="secondary" onClick={onAgain}>
          Repetir
        </Button>
      </div>
    </motion.div>
  );
}
