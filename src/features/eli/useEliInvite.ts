import { useEffect, useRef, useState } from 'react';
import type { EliPlacement } from '@/content/eli';
import { useAppStore } from '@/store/app';

const DAY = 86_400_000;

/**
 * Decides once per mount whether an invitation from Eli may appear here, so it
 * shows up at meaningful moments and never twice in a row:
 * - not while snoozed ("Ahora no"),
 * - not again before `gapDays` since it was last shown,
 * - not for a few days after she already tapped any of Eli's links.
 */
export function useEliInvite(placement: EliPlacement, eligible: boolean, gapDays: number, afterClickDays = 5) {
  const [allowed] = useState(() => {
    const { eli } = useAppStore.getState();
    const now = Date.now();
    if ((eli.snoozed[placement] ?? 0) > now) return false;
    if (now - (eli.seen[placement] ?? 0) < gapDays * DAY) return false;
    return now - eli.lastClickAt > afterClickDays * DAY;
  });
  const [dismissed, setDismissed] = useState(false);
  const show = allowed && eligible && !dismissed;
  const marked = useRef(false);

  useEffect(() => {
    if (show && !marked.current) {
      marked.current = true;
      useAppStore.getState().markEliSeen(placement);
    }
  }, [show, placement]);

  return {
    show,
    dismiss: (snoozeDays: number) => {
      setDismissed(true);
      useAppStore.getState().snoozeEli(placement, snoozeDays);
    },
  };
}
