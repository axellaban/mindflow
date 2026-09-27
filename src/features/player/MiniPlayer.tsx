import { Pause, Play, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CoverArt } from '@/art/CoverArt';
import { haptic } from '@/lib/device';
import { formatClock } from '@/lib/time';
import { SPRING_SOFT } from '@/lib/motion';
import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';
import { itemInfo } from './itemInfo';

export function MiniPlayer() {
  const item = usePlayer((s) => s.item);
  const expanded = usePlayer((s) => s.expanded);
  const status = usePlayer((s) => s.status);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const toggle = usePlayer((s) => s.toggle);
  const close = usePlayer((s) => s.close);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const info = item ? itemInfo(item) : null;
  const playing = status === 'playing' || status === 'loading';
  // the sound mixer shows its own controls for a mix; no need to repeat them below
  const inMixer = useUI((s) => s.mixerOnScreen) && item?.type === 'mix';

  return (
    <AnimatePresence>
      {info && !expanded && !inMixer && (
        <motion.div
          key="mini"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={SPRING_SOFT}
          className="fixed inset-x-3 bottom-[calc(var(--tabbar-h)+max(10px,var(--safe-bottom)))] z-[60] mx-auto max-w-xl lg:bottom-6 lg:left-[calc(260px+24px)] lg:right-6"
        >
          <div className="glass-strong relative flex items-center gap-3 overflow-hidden rounded-[22px] p-2 pr-2.5 shadow-[0_20px_50px_-20px_rgb(2_38_48/0.8)]">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              onClick={() => {
                haptic(6);
                setExpanded(true);
              }}
              aria-label="Abrir reproductor"
            >
              <CoverArt spec={info.art} rounded="rounded-[14px]" className="size-12 shrink-0" grain={false} />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{info.title}</p>
                <p className="truncate text-[12.5px] text-3">
                  {info.infinite ? `${info.eyebrow} · ${formatClock(position)}` : `${info.eyebrow} · ${formatClock(Math.max(0, duration - position))} restantes`}
                </p>
              </div>
            </button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => {
                haptic(6);
                toggle();
              }}
              aria-label={playing ? 'Pausar' : 'Reproducir'}
              className="flex size-11 items-center justify-center rounded-full bg-coral text-ink-950"
            >
              {playing ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
            </motion.button>
            <button type="button" onClick={close} aria-label="Detener y cerrar" className="flex size-9 items-center justify-center rounded-full text-3 hover:bg-white/8 hover:text-mist-50">
              <X className="size-4.5" />
            </button>
            {!info.infinite && duration > 0 && (
              <div className="absolute inset-x-4 bottom-0 h-[2px] overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-mist-50/80 transition-[width] duration-700 ease-linear" style={{ width: `${Math.min(100, (position / duration) * 100)}%` }} />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
