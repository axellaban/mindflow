import type { LogEntry, Profile } from '@/store/app';
import { type DayPart, dayNumber, dayPart } from '@/lib/time';
import { DAILY_POOL, PROGRAM_BY_ID, SESSIONS } from './catalog';
import type { CategoryId, GoalId, Program, Session } from './types';

const GOAL_CATEGORIES: Record<GoalId, CategoryId[]> = {
  dormir: ['sueno'],
  estres: ['estres', 'cuerpo'],
  ansiedad: ['ansiedad'],
  enfoque: ['enfoque'],
  aprender: ['principiantes'],
  autocuidado: ['autocompasion', 'cuerpo'],
  felicidad: ['emociones', 'autocompasion'],
};

const PART_CATEGORIES: Record<DayPart, CategoryId[]> = {
  madrugada: ['sueno'],
  mañana: ['mananas', 'enfoque', 'principiantes'],
  tarde: ['estres', 'enfoque', 'cuerpo', 'ansiedad'],
  noche: ['sueno', 'emociones', 'autocompasion'],
};

export function dailyFor(date = new Date()): Session {
  return DAILY_POOL[((dayNumber(date) % DAILY_POOL.length) + DAILY_POOL.length) % DAILY_POOL.length]!;
}

export function recommended(profile: Profile, history: LogEntry[], date = new Date(), limit = 8): Session[] {
  const part = dayPart(date);
  const goalCats = new Set(profile.goals.flatMap((g) => GOAL_CATEGORIES[g]));
  const partCats = new Set(PART_CATEGORIES[part]);
  const recent = new Map<string, number>();
  for (const h of history) if (h.kind === 'session') recent.set(h.refId, Math.max(recent.get(h.refId) ?? 0, h.at));
  const now = date.getTime();
  const daily = dailyFor(date).id;

  const scored = SESSIONS.filter((s) => s.kind === 'meditation' && !s.daily && (!s.program || s.program.day === 1) && s.id !== daily).map((s) => {
    let score = 0;
    for (const c of s.categories) {
      if (goalCats.has(c)) score += 3;
      if (partCats.has(c)) score += 2;
    }
    if (s.goals?.some((g) => profile.goals.includes(g))) score += 2;
    if (profile.experience === 'nuevo' && s.duration <= 6 * 60) score += 1.5;
    if (part !== 'noche' && part !== 'madrugada' && s.sleep) score -= 4;
    if ((part === 'noche' || part === 'madrugada') && s.categories.includes('mananas')) score -= 5;
    const last = recent.get(s.id);
    if (last && now - last < 3 * 86_400_000) score -= 5;
    // stable daily shuffle so the rail changes a little every day
    score += ((hash(s.id) + dayNumber(date)) % 7) / 10;
    return { s, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}

export function forDayPart(date = new Date()): { title: string; sessions: Session[] } {
  const part = dayPart(date);
  const pick = (ids: string[]) => ids.map((id) => SESSIONS.find((s) => s.id === id)).filter(Boolean) as Session[];
  if (part === 'noche' || part === 'madrugada') {
    return {
      title: 'Para esta noche',
      sessions: [
        ...SESSIONS.filter((s) => s.kind === 'story'),
        ...pick(['dp-3-escaneo-corporal', 'volver-a-dormir', 'relajacion-progresiva', 'dp-5-el-lago']),
      ],
    };
  }
  if (part === 'mañana') {
    return { title: 'Para empezar el día', sessions: pick(['despertar', 'enfoque-profundo', 'pausa-3-minutos', 'gratitud', 'caminar']) };
  }
  return {
    title: 'Un respiro en tu tarde',
    sessions: pick(['pausa-3-minutos', 'soltar-tension', 'nsdr', 'enfoque-profundo', 'caminar', 'montana']),
  };
}

export function suggestedProgram(profile: Profile): Program {
  if (profile.experience === 'nuevo' || profile.goals.includes('aprender')) return PROGRAM_BY_ID['aprende-a-meditar'];
  if (profile.goals.includes('ansiedad')) return PROGRAM_BY_ID['calma-la-ansiedad'];
  if (profile.goals.includes('dormir')) return PROGRAM_BY_ID['duerme-profundo'];
  return PROGRAM_BY_ID['aprende-a-meditar'];
}

/** A session that fits a check-in: how someone feels right now. */
export function forMood(level: number, feelings: string[]): Session | undefined {
  const by = (id: string) => SESSIONS.find((s) => s.id === id);
  const has = (f: string) => feelings.includes(f);
  const night = dayPart() === 'noche' || dayPart() === 'madrugada';
  if (has('ansiedad') || has('abrumado')) return level <= 2 ? by('sos-ansiedad') : by('cla-1-entender');
  if (has('enojo')) return by('cuando-sientes-enojo');
  if (has('estres') || has('inquietud')) return night ? by('dp-4-aquietar-la-mente') : by('soltar-tension');
  if (has('cansancio')) return night ? by('dp-3-escaneo-corporal') : by('nsdr');
  if (has('tristeza') || has('soledad')) return by('cla-5-cuidado');
  if (level <= 2) return by('pausa-3-minutos');
  if (level >= 4) return by('gratitud');
  return night ? by('dp-1-soltar-el-dia') : by('pausa-aqui-y-ahora');
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
