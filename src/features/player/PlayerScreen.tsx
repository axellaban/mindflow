import { Captions, ChevronDown, Ellipsis, Moon, Pause, Play, RotateCcw, RotateCw, Waves } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PALETTES } from '@/art/palettes';
import { Scene } from '@/art/Scene';
import { sceneForArt } from '@/art/sceneFor';
import { IconButton } from '@/components/ui/Button';
import { BED_BY_ID } from '@/content/sounds';
import { haptic } from '@/lib/device';
import { formatClock } from '@/lib/time';
import { EASE, EASE_IN_OUT, SPRING_PRESS, breath, press } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';
import { type Caption, type PlayerItem, usePlayer } from '@/store/player';
import { Completion } from './Completion';
import { itemInfo } from './itemInfo';
import { BedSheet, OptionsSheet, SleepTimerSheet } from './sheets';

function useIdle(active: boolean, ms = 5500): [boolean, () => void] {
  const [idle, setIdle] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poke = useCallback(() => {
    setIdle(false);
    if (timer.current) clearTimeout(timer.current);
    if (active) timer.current = setTimeout(() => setIdle(true), ms);
  }, [active, ms]);
  useEffect(() => {
    poke();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [poke]);
  return [idle && active, poke];
}

export function PlayerScreen() {
  const item = usePlayer((s) => s.item);
  const expanded = usePlayer((s) => s.expanded);
  const open = Boolean(item && expanded);
  // PlayerView keeps receiving the last item as a prop while its exit animation runs.
  return <AnimatePresence>{open && item && <PlayerView key="player" item={item} />}</AnimatePresence>;
}

function PlayerView({ item: liveItem }: { item: PlayerItem }) {
  const current = usePlayer((s) => s.item);
  const item = current ?? liveItem;
  const status = usePlayer((s) => s.status);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const captions = usePlayer((s) => s.captions);
  const bed = usePlayer((s) => s.bed);
  const sleepTimerEnd = usePlayer((s) => s.sleepTimerEnd);
  const error = usePlayer((s) => s.error);
  const { toggle, skip, seek, setExpanded, close } = usePlayer.getState();
  const captionsOn = useAppStore((s) => s.settings.captions);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const info = useMemo(() => itemInfo(item), [item]);
  const scene = useMemo(() => sceneForArt(info.art), [info.art]);
  const tint = PALETTES[info.art.palette].ui;
  const playing = status === 'playing' || status === 'loading';
  const ended = status === 'ended';
  const [idle, poke] = useIdle(playing && !ended);
  const [sheet, setSheet] = useState<null | 'bed' | 'timer' | 'options'>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheet || e.defaultPrevented) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowLeft' && !info.infinite) skip(-15);
      else if (e.key === 'ArrowRight' && !info.infinite) skip(15);
      else if (e.key === 'Escape') setExpanded(false);
      poke();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, toggle, skip, setExpanded, poke, info.infinite]);

  const hideUi = idle && !sheet;
  const finished = ended && Boolean(info.session) && !info.sleep;

  // focus starts inside the player and returns to where it was when it closes
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    rootRef.current?.focus({ preventScroll: true });
    return () => {
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, []);

  return (
    <motion.div
      ref={rootRef}
      tabIndex={-1}
      className="fixed inset-0 z-[70] overflow-hidden bg-ink-900 outline-none"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } }}
      exit={{ opacity: 0, y: 60, transition: { duration: 0.45, ease: EASE } }}
      onPointerMove={poke}
      onPointerDown={poke}
      role="dialog"
      aria-modal="true"
      aria-label={`Reproductor: ${info.title}`}
    >
      {/* when a session ends the scene rests and softens behind the summary */}
      <Scene scene={scene} paused={finished} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-950/55 via-transparent via-40% to-ink-950/90" />
      {finished && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-ink-950/10 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
        />
      )}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-ink-950"
        animate={{ opacity: ended ? (info.sleep ? 0.55 : 0.4) : hideUi ? 0.28 : 0.12 }}
        transition={{ duration: 1.6 }}
      />

      <div className="relative mx-auto flex h-full max-w-2xl flex-col px-5 pt-safe pb-safe md:px-8">
        {/* top bar */}
        <motion.div
          className="flex items-center justify-between py-2"
          animate={{ opacity: hideUi ? 0 : 1 }}
          transition={{ duration: 0.8 }}
          style={{ pointerEvents: hideUi ? 'none' : undefined }}
        >
          <IconButton label="Minimizar" onClick={() => setExpanded(false)}>
            <ChevronDown className="size-5" />
          </IconButton>
          <p className="text-[12px] font-bold tracking-[0.16em] uppercase" style={{ color: tint }}>
            {info.eyebrow}
          </p>
          <IconButton label="Más opciones" onClick={() => setSheet('options')}>
            <Ellipsis className="size-5" />
          </IconButton>
        </motion.div>

        {finished && info.session ? (
          <div className="no-scrollbar flex flex-1 items-start justify-center overflow-y-auto py-6 md:items-center">
            <Completion session={info.session} onDone={close} />
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <motion.div
                animate={{ opacity: hideUi ? 0.55 : 1 }}
                transition={{ duration: 1.2 }}
                className="relative px-4 [text-shadow:0_2px_24px_rgb(3_40_50/0.55)]"
              >
                <span className="pointer-events-none absolute inset-[-55%_-14%] -z-10 bg-[radial-gradient(closest-side,rgb(3_40_50/0.5),transparent)]" />
                <h1 className="font-display text-[38px] leading-[1.05] md:text-[52px]">{info.title}</h1>
                <p className="mt-3 text-[15px] text-2">{ended && info.sleep ? 'Que descanses' : info.subtitle}</p>
              </motion.div>
              {info.session && captionsOn && !ended && <CaptionLine captions={captions} position={position} />}
              {ended && info.sleep && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 max-w-xs text-[14px] text-3">
                  El sonido de fondo seguirá acompañándote un rato y se apagará solo.
                </motion.p>
              )}
              {error && <p role="alert" className="mt-6 max-w-xs rounded-2xl bg-peach-300/12 px-4 py-3 text-[14px] text-peach-300">{error}</p>}
            </div>

            <motion.div
              animate={{ opacity: hideUi ? 0 : 1, y: hideUi ? 12 : 0 }}
              transition={{ duration: 0.8 }}
              className="pb-2"
              style={{ pointerEvents: hideUi ? 'none' : undefined }}
            >
              {!info.infinite ? (
                <Scrubber position={position} duration={duration} onSeek={seek} />
              ) : (
                <p className="mb-2 text-center font-display text-[17px] font-semibold text-2 tabular-nums">{formatClock(position)}</p>
              )}

              <div className="mt-4 flex items-center justify-center gap-8">
                {!info.infinite ? (
                  <IconButton label="Retroceder 15 segundos" variant="plain" size="lg" onClick={() => skip(-15)}>
                    <SkipIcon dir="back" />
                  </IconButton>
                ) : (
                  <span className="size-14" />
                )}
                <div className="relative">
                  <AnimatePresence>
                    {status === 'playing' && (
                      <motion.span
                        key="halo"
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-5 rounded-full bg-mist-50/20 blur-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.35, 0.9, 0.35], scale: [0.9, 1.1, 0.9] }}
                        exit={{ opacity: 0, transition: { duration: 0.8 } }}
                        transition={breath}
                      />
                    )}
                  </AnimatePresence>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    transition={SPRING_PRESS}
                    onClick={() => {
                      haptic(10);
                      toggle();
                    }}
                    aria-label={playing ? 'Pausar' : 'Reproducir'}
                    className="relative flex size-20 items-center justify-center rounded-full bg-mist-50 text-ink-900 shadow-[0_18px_50px_-14px_rgb(247_241_230/0.45)]"
                  >
                    {status === 'loading' && (
                      <motion.span
                        className="absolute inset-[-6px] rounded-full border-2 border-transparent border-t-mist-50/70"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: EASE_IN_OUT }}
                      />
                    )}
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={playing ? 'pause' : 'play'}
                        className="flex"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.28, ease: EASE }}
                      >
                        {playing ? <Pause className="size-8 fill-current" /> : <Play className="ml-1 size-8 fill-current" />}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
                {!info.infinite ? (
                  <IconButton label="Adelantar 15 segundos" variant="plain" size="lg" onClick={() => skip(15)}>
                    <SkipIcon dir="fwd" />
                  </IconButton>
                ) : (
                  <span className="size-14" />
                )}
              </div>

              <div className="mt-7 flex items-center justify-center gap-2.5">
                {info.session && (
                  <Pill onClick={() => setSheet('bed')} icon={<Waves className="size-4" />}>
                    {BED_BY_ID[bed]?.name ?? 'Fondo'}
                  </Pill>
                )}
                <Pill onClick={() => setSheet('timer')} icon={<Moon className="size-4" />} active={Boolean(sleepTimerEnd)}>
                  {sleepTimerEnd ? <TimerLeft end={sleepTimerEnd} /> : 'Temporizador'}
                </Pill>
                {info.session && (
                  <Pill
                    onClick={() => updateSettings({ captions: !captionsOn })}
                    icon={<Captions className="size-5" />}
                    active={captionsOn}
                    label="Subtítulos"
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>

      <BedSheet open={sheet === 'bed'} onClose={() => setSheet(null)} defaultBed={info.session?.bed} />
      <SleepTimerSheet open={sheet === 'timer'} onClose={() => setSheet(null)} />
      <OptionsSheet open={sheet === 'options'} onClose={() => setSheet(null)} info={info} onTimer={() => setSheet('timer')} />
    </motion.div>
  );
}

function SkipIcon({ dir }: { dir: 'back' | 'fwd' }) {
  const Icon = dir === 'back' ? RotateCcw : RotateCw;
  return (
    <span className="relative flex items-center justify-center">
      <Icon className="size-8" strokeWidth={1.5} />
      <span className="absolute pt-0.5 text-[10px] font-bold">15</span>
    </span>
  );
}

function Pill({
  children,
  icon,
  onClick,
  active,
  label,
}: {
  children?: ReactNode;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  label?: string;
}) {
  return (
    <motion.button
      type="button"
      {...press}
      onClick={() => {
        haptic(5);
        onClick();
      }}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full text-[13px] font-semibold backdrop-blur-xl transition-colors duration-300',
        active ? 'bg-mist-50 text-ink-900' : 'bg-white/10 text-mist-50 hover:bg-white/16',
        children ? 'px-4' : 'w-10 justify-center',
      )}
    >
      {icon}
      {children}
    </motion.button>
  );
}

function TimerLeft({ end }: { end: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="tabular-nums">{formatClock((end - now) / 1000)}</span>;
}

function CaptionLine({ captions, position }: { captions: Caption[]; position: number }) {
  const current = useMemo(() => {
    for (let i = captions.length - 1; i >= 0; i--) {
      const c = captions[i]!;
      if (c.s <= position + 0.15) return position <= c.e + 1.2 ? c : null;
    }
    return null;
  }, [captions, position]);
  return (
    <div className="mt-8 flex min-h-[5.5em] max-w-lg items-start justify-center px-2" aria-live="polite">
      <AnimatePresence mode="wait">
        {current && (
          <motion.p
            key={current.s}
            initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-[19px] leading-relaxed text-mist-50/90 [text-shadow:0_2px_18px_rgb(3_40_50/0.7)] md:text-[22px]"
          >
            {current.t}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Scrubber({ position, duration, onSeek }: { position: number; duration: number; onSeek: (t: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? position;
  const pct = duration > 0 ? Math.min(1, shown / duration) : 0;

  const at = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * duration;
  };

  return (
    <div className="select-none">
      <div
        ref={ref}
        role="slider"
        aria-label="Progreso"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(shown)}
        aria-valuetext={`${formatClock(shown)} de ${formatClock(duration)}`}
        tabIndex={0}
        className="group relative flex h-8 cursor-pointer touch-none items-center"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setDrag(at(e.clientX));
        }}
        onPointerMove={(e) => drag !== null && setDrag(at(e.clientX))}
        onPointerUp={(e) => {
          if (drag !== null) onSeek(at(e.clientX));
          setDrag(null);
        }}
        onPointerCancel={() => setDrag(null)}
        onKeyDown={(e) => {
          const to =
            e.key === 'ArrowLeft' || e.key === 'ArrowDown'
              ? Math.max(0, position - 5)
              : e.key === 'ArrowRight' || e.key === 'ArrowUp'
                ? Math.min(duration, position + 5)
                : e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? Math.max(0, duration - 1)
                    : null;
          if (to === null) return;
          // the player also listens for arrows; this slider owns them while focused
          e.preventDefault();
          onSeek(to);
        }}
      >
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/18">
          <div className="h-full rounded-full bg-mist-50" style={{ width: `${pct * 100}%` }} />
        </div>
        <div
          className={cn(
            'absolute size-3.5 -translate-x-1/2 rounded-full bg-white shadow-md transition-transform duration-200',
            drag !== null ? 'scale-125' : 'scale-100 group-hover:scale-110',
          )}
          style={{ left: `${pct * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[12px] font-medium text-3 tabular-nums">
        <span>{formatClock(shown)}</span>
        <span>-{formatClock(Math.max(0, duration - shown))}</span>
      </div>
    </div>
  );
}
