import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PROGRAMS, SESSION_BY_ID } from '@/content/catalog';
import type { Program } from '@/content/types';
import { useAppStore } from '@/store/app';
import { currentStreak, practiceDays, totalMinutes } from './stats';

export function useCompletedSessions(): Set<string> {
  const history = useAppStore((s) => s.history);
  return useMemo(() => new Set(history.filter((h) => h.kind === 'session' && h.completed).map((h) => h.refId)), [history]);
}

export function useStats() {
  const history = useAppStore((s) => s.history);
  return useMemo(() => {
    const days = practiceDays(history);
    return {
      days,
      streak: currentStreak(days),
      minutes: totalMinutes(history),
      sessions: history.filter((h) => h.completed || h.seconds >= 60).length,
    };
  }, [history]);
}

export interface ProgramProgress {
  program: Program;
  done: number[];
  nextDay: number | null;
  nextSessionId: string | null;
  complete: boolean;
}

export function programProgress(program: Program, done: number[]): ProgramProgress {
  const total = program.sessions.length;
  let nextDay: number | null = null;
  for (let d = 1; d <= total; d++) {
    if (!done.includes(d)) {
      nextDay = d;
      break;
    }
  }
  return {
    program,
    done,
    nextDay,
    nextSessionId: nextDay ? program.sessions[nextDay - 1]! : null,
    complete: nextDay === null,
  };
}

export function useProgramProgress(): ProgramProgress[] {
  const programs = useAppStore((s) => s.programs);
  return useMemo(() => PROGRAMS.map((p) => programProgress(p, programs[p.id] ?? [])), [programs]);
}

/** The program the user is currently working through (started, not finished). */
export function useActiveProgram(): ProgramProgress | null {
  const all = useProgramProgress();
  const history = useAppStore((s) => s.history);
  return useMemo(() => {
    const started = all.filter((p) => p.done.length > 0 && !p.complete);
    if (!started.length) return null;
    // most recently touched
    const lastTouch = (p: ProgramProgress) => {
      const ids = new Set(p.program.sessions);
      for (let i = history.length - 1; i >= 0; i--) if (ids.has(history[i]!.refId)) return history[i]!.at;
      return 0;
    };
    return started.sort((a, b) => lastTouch(b) - lastTouch(a))[0] ?? null;
  }, [all, history]);
}

export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    on();
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}

export function sessionExists(id: string): boolean {
  return Boolean(SESSION_BY_ID[id]);
}

/**
 * Goes back one screen inside the app. When this is the first screen of the visit (a shared link,
 * a new tab), goes to `fallback` instead, so closing never takes you out of the app.
 */
export function useBack(fallback = '/'): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    // React Router numbers the entries it creates; 0 is where the visit started
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) void navigate(-1);
    else void navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}
