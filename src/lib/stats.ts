import { addDays, dayKey, fromDayKey } from './time';

export interface PracticeLike {
  day: string;
  seconds: number;
  completed: boolean;
}

/** Days that count toward the streak: at least one minute of practice, or any completed session. */
export function practiceDays(history: readonly PracticeLike[]): Set<string> {
  const perDay = new Map<string, number>();
  const done = new Set<string>();
  for (const h of history) {
    perDay.set(h.day, (perDay.get(h.day) ?? 0) + h.seconds);
    if (h.completed) done.add(h.day);
  }
  const out = new Set<string>(done);
  for (const [day, secs] of perDay) if (secs >= 60) out.add(day);
  return out;
}

export function currentStreak(days: Set<string>, today: Date = new Date()): number {
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // A streak stays alive until the end of today even if today hasn't been practiced yet.
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function longestStreak(days: Set<string>): number {
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const d = fromDayKey(key);
    if (prev && dayKey(addDays(prev, 1)) === key) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function totalMinutes(history: readonly PracticeLike[]): number {
  return history.reduce((acc, h) => acc + h.seconds, 0) / 60;
}

export function minutesByDay(history: readonly PracticeLike[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const h of history) m.set(h.day, (m.get(h.day) ?? 0) + h.seconds / 60);
  return m;
}

/** Monday-based current week (7 day keys). */
export function currentWeek(today: Date = new Date()): string[] {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const offset = (d.getDay() + 6) % 7;
  const monday = addDays(d, -offset);
  return Array.from({ length: 7 }, (_, i) => dayKey(addDays(monday, i)));
}
