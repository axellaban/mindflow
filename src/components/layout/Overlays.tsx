import { CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ACHIEVEMENT_BY_ID } from '@/content/achievements';
import { haptic } from '@/lib/device';
import { EASE, breath } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const hasMini = usePlayer((s) => Boolean(s.item) && !s.expanded);
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-8 lg:pl-[260px]',
        hasMini ? 'bottom-[calc(var(--tabbar-h)+max(10px,var(--safe-bottom))+84px)]' : 'bottom-[calc(var(--tabbar-h)+max(10px,var(--safe-bottom))+12px)]',
      )}
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.35, ease: 'easeOut' } }}
            transition={{ duration: 0.6, ease: EASE }}
            className="glass-strong flex items-center gap-2.5 rounded-full px-5 py-3 text-[14px] font-semibold shadow-[0_16px_40px_-16px_rgb(0_0_0/0.7)]"
          >
            {t.tone === 'success' && <CheckCircle2 className="size-4.5 text-sage-300" />}
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Celebration() {
  const queue = useUI((s) => s.celebration);
  const clear = useUI((s) => s.clearCelebration);
  const expanded = usePlayer((s) => s.expanded && Boolean(s.item));
  const [index, setIndex] = useState(0);
  const current = queue[index];
  const def = current ? ACHIEVEMENT_BY_ID[current] : null;

  useEffect(() => {
    if (def) haptic([10, 60, 20]);
  }, [def]);

  // Don't interrupt the completion screen; show right after the player closes.
  const visible = Boolean(def) && !expanded;

  const next = () => {
    if (index + 1 < queue.length) setIndex(index + 1);
    else {
      setIndex(0);
      clear();
    }
  };

  return (
    <AnimatePresence>
      {visible && def && (
        <motion.div
          key={def.id}
          className="fixed inset-0 z-[95] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="absolute inset-0 bg-ink-950/80" onClick={next} />
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-ink-800/95 px-7 pt-10 pb-7 text-center"
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-gold-300/20 blur-3xl" />
            <div className="relative mx-auto flex size-24 items-center justify-center">
              {/* a soft glow that breathes, and two ripples like a drop on still water */}
              <motion.span
                aria-hidden="true"
                className="absolute -inset-5 rounded-full bg-gold-300/25 blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.45, 1, 0.45], scale: [0.92, 1.08, 0.92] }}
                transition={breath}
              />
              {[0.5, 1.3].map((delay) => (
                <motion.span
                  key={delay}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-gold-300/50"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: 2.1, opacity: [0, 0.6, 0] }}
                  transition={{ duration: 2.8, delay, ease: EASE }}
                />
              ))}
              <motion.div
                className="relative flex size-24 items-center justify-center rounded-full"
                style={{ background: 'radial-gradient(circle at 35% 30%, #fff6e6, #f6deaf 55%, #7cc5bf)' }}
                initial={{ opacity: 0, scale: 0.85, filter: 'blur(6px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
              >
                <Icon name={def.icon} className="size-10 text-ink-900" strokeWidth={1.8} />
              </motion.div>
            </div>
            <p className="relative mt-6 text-[12px] font-bold tracking-[0.16em] text-gold-300 uppercase">Nuevo logro</p>
            <h2 className="relative mt-2 font-display text-[28px] leading-tight">{def.title}</h2>
            <p className="relative mt-2 text-[15px] text-2">{def.description}</p>
            <Button full size="lg" className="relative mt-7" onClick={next}>
              {index + 1 < queue.length ? 'Siguiente' : 'Genial'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
