import { CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ACHIEVEMENT_BY_ID } from '@/content/achievements';
import { haptic } from '@/lib/device';
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
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
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
        >
          <div className="absolute inset-0 bg-ink-950/80" onClick={next} />
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-[32px] border border-white/10 bg-ink-800/95 px-7 pt-10 pb-7 text-center"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-peach-300/25 blur-3xl" />
            <motion.div
              className="relative mx-auto flex size-24 items-center justify-center rounded-full"
              style={{ background: 'radial-gradient(circle at 35% 30%, #fff6e6, #ffbf99 55%, #f0a9bd)' }}
              initial={{ rotate: -20, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.1 }}
            >
              <Icon name={def.icon} className="size-10 text-ink-900" strokeWidth={1.8} />
              {Array.from({ length: 10 }, (_, i) => (
                <motion.span
                  key={i}
                  className="absolute size-1.5 rounded-full bg-gold-300"
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 10) * Math.PI * 2) * 80,
                    y: Math.sin((i / 10) * Math.PI * 2) * 80,
                    opacity: 0,
                  }}
                  transition={{ duration: 1.2, delay: 0.25, ease: 'easeOut' }}
                />
              ))}
            </motion.div>
            <p className="relative mt-6 text-[12px] font-bold tracking-[0.16em] text-peach-300 uppercase">Nuevo logro</p>
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
