import type { GoalId } from './types';

/**
 * What the user finds hardest right now. Mirrors the questions in Eli's
 * intake form, so the app and her 1:1 sessions speak the same language.
 */
export const GOALS: Array<{ id: GoalId; label: string; /** "Me está costando …" */ phrase: string }> = [
  { id: 'estres', label: 'Estrés', phrase: 'el estrés' },
  { id: 'mente', label: 'Mente acelerada', phrase: 'frenar la mente' },
  { id: 'autoexigencia', label: 'Autoexigencia', phrase: 'la autoexigencia' },
  { id: 'descanso', label: 'Descansar', phrase: 'descansar' },
  { id: 'culpa', label: 'Culpa', phrase: 'la culpa' },
  { id: 'ansiedad', label: 'Ansiedad', phrase: 'la ansiedad' },
  { id: 'dormir', label: 'Dormir mejor', phrase: 'dormir bien' },
  { id: 'autocuidado', label: 'Cuidarme más', phrase: 'el autocuidado' },
  { id: 'aprender', label: 'Aprender a meditar', phrase: 'arrancar con la meditación' },
];

export const GOAL_BY_ID = Object.fromEntries(GOALS.map((g) => [g.id, g])) as Record<GoalId, (typeof GOALS)[number]>;

/** "la autoexigencia y descansar": reads right after both "me está costando" and "te está costando". */
export function goalsPhrase(goals: GoalId[], max = 2): string | null {
  const parts = goals
    .filter((g) => g !== 'aprender')
    .slice(0, max)
    .map((g) => GOAL_BY_ID[g]?.phrase)
    .filter(Boolean) as string[];
  if (!parts.length) return null;
  return parts.length === 1 ? parts[0]! : `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
}
