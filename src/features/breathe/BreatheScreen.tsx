import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { BreathTone } from '@/audio/bells';
import { engine } from '@/audio/engine';
import { PALETTES, rgba } from '@/art/palettes';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/controls';
import { BREATH_BY_ID, BREATH_PATTERNS, type BreathPattern, type PhaseKind, cycleSeconds } from '@/content/breathing';
import { haptic, keepAwake } from '@/lib/device';
import { formatClock } from '@/lib/time';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';

const MINUTES = [1, 2, 3, 5, 10];
const MIN_SCALE = 0.56;
const TARGET: Record<PhaseKind, number | null> = { in: 1, in2: 1.1, out: MIN_SCALE, hold: null, rest: null };

type Stage = 'setup' | 'run' | 'done';

export function BreatheScreen() {
  const navigate = useNavigate();
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
  const palette = PALETTES[pattern.palette];

  const exit = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  const start = () => {
    updateSettings({ breathe: { patternId, minutes, sound } });
    usePlayer.getState().close();
    engine.unlock(true);
    setStage('run');
  };

  return (
    <div className="fixed inset-0 z-[65] overflow-hidden bg-ink-900">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(120% 80% at 50% 40%, ${rgba(palette.sky[1], 0.95)} 0%, ${rgba(palette.sky[0], 1)} 55%, #0e0811 100%)`,
        }}
        transition={{ duration: 1.2 }}
      />
      <div className="grain absolute inset-0" />
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
    </div>
  );
}

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
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
                whileTap={{ scale: 0.98 }}
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
  const glow = useTransform(scale, [MIN_SCALE, 1.1], [0.25, 0.85]);
  const ringScale = useTransform(scale, (s) => s * 1.28);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseLeft, setPhaseLeft] = useState(pattern.phases[0]!.seconds);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [countIn, setCountIn] = useState(3);
  const toneRef = useRef<BreathTone | null>(null);
  const state = useRef({ elapsed: 0, phase: 0, phaseT: 0, from: MIN_SCALE, cycles: 0, last: 0 });
  const palette = PALETTES[pattern.palette];
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

  // count-in 3·2·1
  useEffect(() => {
    if (countIn <= 0) return;
    const t = setTimeout(() => setCountIn((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [countIn]);

  // audio + wake lock lifetime
  useEffect(() => {
    void keepAwake(true);
    engine.bell('cuenco', 0.35);
    return () => {
      void keepAwake(false);
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
      setPhaseLeft(Math.max(0, ph.seconds - s.phaseT));
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
  }, [countIn, paused, pattern, scale, total, finish, onFinish]);

  const phase = pattern.phases[phaseIdx]!;
  const remaining = Math.max(0, total - elapsed);
  const cycle = cycleSeconds(pattern);

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
        <p className="font-display text-[15px] text-2 tabular-nums">{formatClock(remaining)}</p>
        <IconButton label={sound ? 'Silenciar guía' : 'Activar guía'} onClick={() => onSound(!sound)}>
          {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </IconButton>
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center">
        {/* halo */}
        <motion.div
          className="absolute size-[min(86vw,440px)] rounded-full"
          style={{
            scale: ringScale,
            opacity: glow,
            background: `radial-gradient(circle, ${rgba(palette.accent[1], 0.35)} 0%, ${rgba(palette.accent[2], 0.08)} 55%, transparent 70%)`,
          }}
        />
        {/* orbit ring */}
        <motion.div
          className="absolute size-[min(78vw,400px)] rounded-full border border-white/10"
          style={{ scale: ringScale }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 72, 144, 216, 288].map((deg, i) => (
            <span
              key={deg}
              className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-white/70"
              style={{ transform: `rotate(${deg}deg) translate(calc(min(39vw, 200px))) `, opacity: 0.4 + i * 0.12 }}
            />
          ))}
        </motion.div>
        {/* bubble */}
        <motion.div
          className="relative flex size-[min(70vw,360px)] items-center justify-center rounded-full"
          style={{
            scale,
            background: `radial-gradient(circle at 34% 28%, ${rgba('#ffffff', 0.95)} 0%, ${rgba(palette.accent[0], 0.9)} 22%, ${rgba(palette.accent[1], 0.75)} 55%, ${rgba(palette.accent[2], 0.55)} 100%)`,
            boxShadow: `0 0 90px 10px ${rgba(palette.accent[1], 0.35)}, inset 0 -30px 60px ${rgba(palette.sky[0], 0.35)}`,
          }}
        />
        <div className="pointer-events-none absolute flex flex-col items-center text-ink-900">
          <AnimatePresence mode="wait">
            {countIn > 0 ? (
              <motion.span
                key={`c${countIn}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="font-display text-[56px] text-ink-900/80"
              >
                {countIn}
              </motion.span>
            ) : (
              <motion.div
                key={`${phaseIdx}-${phase.label}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col items-center"
              >
                <span className="font-display text-[30px] leading-none text-ink-900/85">{phase.label}</span>
                <span className="mt-2 text-[15px] font-semibold text-ink-900/55 tabular-nums">{Math.ceil(phaseLeft)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-5 px-6 pb-4">
        <p className="text-[14px] text-2">
          {pattern.name} · {pattern.short} · {new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(60 / cycle)} resp/min
        </p>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
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
      <motion.div
        className="mb-8 size-28 rounded-full"
        style={{ background: `radial-gradient(circle at 34% 28%, #fff, ${PALETTES[pattern.palette].accent[1]} 60%, ${PALETTES[pattern.palette].accent[2]})` }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <p className="text-[13px] font-bold tracking-[0.16em] text-2 uppercase">Práctica completada</p>
      <h2 className="mt-2 font-display text-[36px] leading-tight">{line}</h2>
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
