import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { EASE, SPRING_SOFT } from '@/lib/motion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Accessible name when the sheet has no visible title. */
  label?: string;
  className?: string;
  /** Wider centered dialog on desktop */
  size?: 'sm' | 'md' | 'lg';
}

const WIDTHS = { sm: 'md:max-w-md', md: 'md:max-w-lg', lg: 'md:max-w-2xl' };
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onClose, children, title, label, className, size = 'md' }: SheetProps) {
  const controls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  // callers pass inline handlers; keep the latest without re-running the focus effect
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Focus moves into the sheet, stays there while it is open and goes back where it was after.
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current();
        return;
      }
      const panel = panelRef.current;
      if (e.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => {
      const panel = panelRef.current;
      if (panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
    }, 60);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
      if (before?.isConnected) before.focus({ preventScroll: true });
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title ?? label}>
          <motion.div
            className="absolute inset-0 bg-ink-950/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className={cn(
              'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[32px] border border-white/10 bg-ink-800 shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.6)] outline-none md:rounded-[32px]',
              WIDTHS[size],
              className,
            )}
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.4 }}
            transition={SPRING_SOFT}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="flex cursor-grab touch-none justify-center pt-3 pb-1 active:cursor-grabbing" onPointerDown={(e) => controls.start(e)}>
              <div className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>
            {title && <h2 className="px-6 pt-2 pb-1 font-display text-[22px] leading-tight">{title}</h2>}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-2 pb-safe">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
