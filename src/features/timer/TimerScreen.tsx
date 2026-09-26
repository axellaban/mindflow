import { Minus, Pause, Play, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { engine } from '@/audio/engine';
import { Button, IconButton } from '@/components/ui/Button';
import { Chip, ProgressRing } from '@/components/ui/controls';
import { BED_BY_ID } from '@/content/sounds';
import type { BedId } from '@/content/types';
import { haptic, keepAwake } from '@/lib/device';
import { SPRING_PRESS, breath } from '@/lib/motion';
import { formatClock } from '@/lib/time';
import { type BellId, useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';

const PRESETS = [3, 5, 10, 15, 20, 30, 45, 60];
const INTERVALS = [0, 1, 2, 5, 10];
const BELLS: Array<{ id: BellId; name: string }> = [
  { id: 'cuenco', name: 'Cuenco' },
  { id: 'campana', name: 'Campana' },
  { id: 'gong', name: 'Gong' },
  { id: 'madera', name: 'Madera' },
];
const AMBIENCE: BedId[] = ['none', 'lluvia', 'oceano', 'bosque', 'fuego', 'noche', 'cuencos', 'pad'];

type Stage = 'setup' | 'run' | 'done';

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export function TimerScreen() {
  const navigate = useNavigate();
  const saved = useAppStore((s) => s.settings.timer);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [minutes, setMinutes] = useState(saved.minutes);
  const [interval, setIntervalMin] = useState(saved.intervalMin);
  const [bell, setBell] = useState<BellId>(saved.bell);
  const [ambience, setAmbience] = useState<BedId>(saved.ambience);
  const [stage, setStage] = useState<Stage>('setup');
  const [result, setResult] = useState(0);

  const exit = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  return (
    <div className="fixed inset-0 z-[65] overflow-hidden bg-ink-900">
      <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_35%,#31453b_0%,#1c2a25_60%,#101916_100%)]" />
      <div className="grain absolute inset-0" />
      <AnimatePresence mode="wait">
        {stage === 'setup' && (
          <motion.div key="setup" {...fade} className="relative mx-auto flex h-full max-w-2xl flex-col pt-safe pb-safe">
            <div className="flex items-center justify-between px-5 py-2">
              <IconButton label="Cerrar" onClick={exit}>
                <X className="size-5" />
              </IconButton>
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto px-5">
              <div className="pt-3 text-center">
                <p className="text-[12px] font-bold tracking-[0.16em] text-2 uppercase">Temporizador</p>
                <h1 className="mt-2 font-display text-[34px] leading-tight md:text-[42px]">Meditá en silencio</h1>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6">
                <IconButton label="Menos tiempo" size="lg" onClick={() => setMinutes((m) => Math.max(1, m <= 10 ? m - 1 : m - 5))}>
                  <Minus className="size-5" />
                </IconButton>
                <div className="w-40 text-center">
                  <span className="font-display text-[72px] leading-none tabular-nums">{minutes}</span>
                  <span className="mt-1 block text-[14px] text-3">minutos</span>
                </div>
                <IconButton label="Más tiempo" size="lg" onClick={() => setMinutes((m) => Math.min(180, m < 10 ? m + 1 : m + 5))}>
                  <Plus className="size-5" />
                </IconButton>
              </div>
              <div className="no-scrollbar mt-6 flex justify-start gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center">
                {PRESETS.map((m) => (
                  <Chip key={m} active={m === minutes} onClick={() => setMinutes(m)}>
                    {m}
                  </Chip>
                ))}
              </div>

              <Group title="Campana de intervalo">
                {INTERVALS.map((i) => (
                  <Chip key={i} active={i === interval} onClick={() => setIntervalMin(i)}>
                    {i ? `Cada ${i} min` : 'Sin intervalos'}
                  </Chip>
                ))}
              </Group>
              <Group title="Sonido de campana">
                {BELLS.map((b) => (
                  <Chip
                    key={b.id}
                    active={b.id === bell}
                    onClick={() => {
                      setBell(b.id);
                      engine.unlock(false);
                      engine.bell(b.id, 0.45);
                    }}
                  >
                    {b.name}
                  </Chip>
                ))}
              </Group>
              <Group title="Ambiente">
                {AMBIENCE.map((a) => (
                  <Chip key={a} active={a === ambience} onClick={() => setAmbience(a)}>
                    {BED_BY_ID[a].name}
                  </Chip>
                ))}
              </Group>
            </div>
            <div className="px-5 pt-4">
              <Button
                full
                size="lg"
                onClick={() => {
                  updateSettings({ timer: { minutes, intervalMin: interval, bell, ambience } });
                  usePlayer.getState().close();
                  engine.unlock(true);
                  setStage('run');
                }}
              >
                Comenzar
              </Button>
            </div>
          </motion.div>
        )}
        {stage === 'run' && (
          <Running
            key="run"
            minutes={minutes}
            interval={interval}
            bell={bell}
            ambience={ambience}
            onDone={(secs) => {
              setResult(secs);
              setStage('done');
            }}
            onClose={exit}
          />
        )}
        {stage === 'done' && (
          <motion.div key="done" {...fade} className="relative mx-auto flex h-full max-w-md flex-col items-center justify-center px-6 text-center">
            <p className="text-[13px] font-bold tracking-[0.16em] text-2 uppercase">Meditación completada</p>
            <h2 className="mt-3 font-display text-[40px] leading-tight">
              {Math.max(1, Math.round(result / 60))} minutos de silencio
            </h2>
            <p className="mt-3 text-[15px] text-2">El silencio también es una práctica. Gracias por dártelo.</p>
            <div className="mt-10 flex w-full flex-col gap-2.5">
              <Button full size="lg" onClick={exit}>
                Listo
              </Button>
              <Button full size="lg" variant="secondary" onClick={() => setStage('setup')}>
                Otra vez
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-7">
      <p className="mb-3 text-center text-[13px] font-semibold text-3">{title}</p>
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
    </div>
  );
}

function Running({
  minutes,
  interval,
  bell,
  ambience,
  onDone,
  onClose,
}: {
  minutes: number;
  interval: number;
  bell: BellId;
  ambience: BedId;
  onDone: (secs: number) => void;
  onClose: () => void;
}) {
  const total = minutes * 60;
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef({ elapsed: 0, last: 0, nextBell: interval ? interval * 60 : Infinity, done: false });
  const logPractice = useAppStore((s) => s.logPractice);

  const finish = useCallback(
    (completed: boolean) => {
      const secs = Math.round(ref.current.elapsed);
      const fresh = logPractice({ kind: 'timer', refId: 'timer', title: `Temporizador · ${minutes} min`, at: Date.now() - secs * 1000, seconds: secs, completed });
      if (fresh.length) useUI.getState().celebrate(fresh);
      return secs;
    },
    [logPractice, minutes],
  );

  useEffect(() => {
    void keepAwake(true);
    engine.bell(bell, 0.55);
    engine.setLayersVolume(0.7, 0.2);
    engine.setMix(BED_BY_ID[ambience].mix, 4);
    return () => {
      void keepAwake(false);
      engine.stopAll(2);
      engine.releaseKeepAlive();
    };
  }, [bell, ambience]);

  useEffect(() => {
    if (paused) {
      engine.setLayersVolume(0, 0.8);
      return;
    }
    engine.setLayersVolume(0.7, 0.8);
    const r = ref.current;
    r.last = performance.now();
    const t = setInterval(() => {
      const now = performance.now();
      r.elapsed += (now - r.last) / 1000;
      r.last = now;
      if (r.elapsed >= r.nextBell && r.elapsed < total - 5) {
        engine.bell(bell, 0.32);
        haptic([12, 80, 12]);
        r.nextBell += interval * 60;
      }
      if (r.elapsed >= total && !r.done) {
        r.done = true;
        engine.bell(bell, 0.6);
        engine.bell(bell, 0.45, 5);
        engine.setMix({}, 8);
        haptic([20, 100, 20]);
        onDone(finish(true));
        return;
      }
      setElapsed(r.elapsed);
    }, 250);
    return () => clearInterval(t);
  }, [paused, total, interval, bell, finish, onDone]);

  const remaining = Math.max(0, total - elapsed);

  return (
    <motion.div {...fade} className="relative flex h-full flex-col items-center pt-safe pb-safe">
      <div className="flex w-full max-w-2xl items-center justify-between px-5 py-2">
        <IconButton
          label="Terminar"
          onClick={() => {
            if (ref.current.elapsed >= 30) onDone(finish(false));
            else onClose();
          }}
        >
          <X className="size-5" />
        </IconButton>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative">
          <motion.div
            className="absolute inset-[-40px] rounded-full bg-blush-400/10 blur-2xl"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={breath}
          />
          <ProgressRing value={elapsed / total} size={290} stroke={2.5}>
            <div className="text-center">
              <p className="font-display text-[64px] leading-none tabular-nums">{formatClock(remaining)}</p>
              <p className="mt-3 text-[14px] text-3">{paused ? 'En pausa' : interval ? `Campana cada ${interval} min` : 'En silencio'}</p>
            </div>
          </ProgressRing>
        </div>
      </div>
      <div className="pb-6">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          transition={SPRING_PRESS}
          onClick={() => {
            haptic(8);
            setPaused((p) => !p);
          }}
          aria-label={paused ? 'Continuar' : 'Pausar'}
          className="flex size-16 items-center justify-center rounded-full bg-white/12 backdrop-blur-xl hover:bg-white/18"
        >
          {paused ? <Play className="ml-1 size-6 fill-current" /> : <Pause className="size-6 fill-current" />}
        </motion.button>
      </div>
    </motion.div>
  );
}
