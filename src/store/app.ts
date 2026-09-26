import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AchievementId } from '@/content/achievements';
import type { EliPlacement } from '@/content/eli';
import { PROGRAMS, SESSION_BY_ID } from '@/content/catalog';
import type { MoodLevel } from '@/content/journal';
import type { SceneId } from '@/content/scenes';
import type { BedId, GoalId, Mix } from '@/content/types';
import { currentStreak, practiceDays, totalMinutes } from '@/lib/stats';
import { dayKey } from '@/lib/time';
import { uid } from '@/lib/utils';

export type LogKind = 'session' | 'breathe' | 'timer' | 'music' | 'mix';

export interface LogEntry {
  id: string;
  kind: LogKind;
  refId: string;
  title: string;
  at: number;
  day: string;
  seconds: number;
  completed: boolean;
}

export interface MoodEntry {
  id: string;
  at: number;
  day: string;
  level: MoodLevel;
  feelings: string[];
  note?: string;
  source: 'checkin' | 'after';
}

export interface JournalEntry {
  id: string;
  at: number;
  day: string;
  prompt: string;
  text: string;
}

export interface SavedMix {
  id: string;
  name: string;
  mix: Mix;
  createdAt: number;
}

export type BellId = 'cuenco' | 'campana' | 'gong' | 'madera';

export interface Settings {
  bedVolume: number;
  captions: boolean;
  haptics: boolean;
  keepAwake: boolean;
  sceneId: SceneId;
  sceneSound: boolean;
  reminderTime: string | null;
  sleepFadeMinutes: number;
  timer: { minutes: number; intervalMin: number; bell: BellId; ambience: BedId };
  breathe: { patternId: string; minutes: number; sound: boolean };
}

export interface Profile {
  name: string;
  goals: GoalId[];
  experience: 'nuevo' | 'algo' | 'regular' | null;
  createdAt: number;
  onboarded: boolean;
}

/** How often Eli's invitations were shown, snoozed or tapped, so they never feel pushy. */
export interface EliState {
  seen: Partial<Record<EliPlacement, number>>;
  snoozed: Partial<Record<EliPlacement, number>>;
  clicks: Partial<Record<string, number>>;
  lastClickAt: number;
}

interface Data {
  profile: Profile;
  settings: Settings;
  history: LogEntry[];
  favorites: string[];
  programs: Record<string, number[]>;
  moods: MoodEntry[];
  journal: JournalEntry[];
  mixes: SavedMix[];
  achievements: Partial<Record<AchievementId, number>>;
  eli: EliState;
}

interface Actions {
  completeOnboarding: (p: Pick<Profile, 'name' | 'goals' | 'experience'>) => void;
  updateProfile: (p: Partial<Profile>) => void;
  updateSettings: (s: Partial<Settings>) => void;
  logPractice: (e: Omit<LogEntry, 'id' | 'day'>) => AchievementId[];
  toggleFavorite: (key: string) => boolean;
  addMood: (m: Omit<MoodEntry, 'id' | 'at' | 'day'>) => AchievementId[];
  deleteMood: (id: string) => void;
  addJournal: (j: Omit<JournalEntry, 'id' | 'at' | 'day'>) => AchievementId[];
  deleteJournal: (id: string) => void;
  saveMix: (name: string, mix: Mix) => SavedMix;
  deleteMix: (id: string) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  resetAll: () => void;
  markEliSeen: (placement: EliPlacement) => void;
  snoozeEli: (placement: EliPlacement, days: number) => void;
  trackEliClick: (key: string) => void;
}

export type AppState = Data & Actions;

const APP_ID = 'mindfulness-by-eli';
const STORAGE_KEY = 'mindfulness-by-eli';

// Keep data saved under the app's previous name.
try {
  const legacy = localStorage.getItem('mindflow');
  if (legacy && !localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, legacy);
} catch {
  /* storage unavailable */
}

const DEFAULTS: Data = {
  profile: { name: '', goals: [], experience: null, createdAt: Date.now(), onboarded: false },
  settings: {
    bedVolume: 0.65,
    captions: false,
    haptics: true,
    keepAwake: true,
    sceneId: 'playa',
    sceneSound: false,
    reminderTime: null,
    sleepFadeMinutes: 20,
    timer: { minutes: 10, intervalMin: 0, bell: 'cuenco', ambience: 'none' },
    breathe: { patternId: 'coherencia', minutes: 3, sound: true },
  },
  history: [],
  favorites: [],
  programs: {},
  moods: [],
  journal: [],
  mixes: [],
  achievements: {},
  eli: { seen: {}, snoozed: {}, clicks: {}, lastClickAt: 0 },
};

function evaluateAchievements(s: Data): AchievementId[] {
  const has = (id: AchievementId) => Boolean(s.achievements[id]);
  const unlocked: AchievementId[] = [];
  const add = (id: AchievementId, cond: boolean) => {
    if (cond && !has(id)) unlocked.push(id);
  };
  const days = practiceDays(s.history);
  const streak = currentStreak(days);
  const minutes = totalMinutes(s.history);
  add('primer-paso', s.history.some((h) => h.completed || h.seconds >= 60));
  add('racha-3', streak >= 3);
  add('racha-7', streak >= 7);
  add('racha-21', streak >= 21);
  add('racha-30', streak >= 30);
  add('minutos-60', minutes >= 60);
  add('minutos-300', minutes >= 300);
  add('minutos-600', minutes >= 600);
  add(
    'programa',
    PROGRAMS.some((p) => (s.programs[p.id]?.length ?? 0) >= p.sessions.length),
  );
  add(
    'noche',
    s.history.some((h) => h.kind === 'session' && SESSION_BY_ID[h.refId]?.sleep && h.seconds >= 120),
  );
  add('respira-10', s.history.filter((h) => h.kind === 'breathe' && h.completed).length >= 10);
  add('silencio', s.history.filter((h) => h.kind === 'timer' && h.seconds >= 60).length >= 3);
  add('diario-7', s.moods.length + s.journal.length >= 7);
  const cats = new Set<string>();
  for (const h of s.history) {
    if (h.kind !== 'session' || h.seconds < 60) continue;
    for (const c of SESSION_BY_ID[h.refId]?.categories ?? []) cats.add(c);
  }
  add('curiosidad', cats.size >= 5);
  add(
    'madrugada',
    s.history.some((h) => h.seconds >= 60 && new Date(h.at).getHours() < 8 && new Date(h.at).getHours() >= 4),
  );
  return unlocked;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => {
      const unlock = (): AchievementId[] => {
        const fresh = evaluateAchievements(get());
        if (fresh.length) {
          const now = Date.now();
          set((st) => ({
            achievements: { ...st.achievements, ...Object.fromEntries(fresh.map((id) => [id, now])) },
          }));
        }
        return fresh;
      };

      return {
        ...DEFAULTS,

        completeOnboarding: (p) =>
          set((st) => ({ profile: { ...st.profile, ...p, onboarded: true, createdAt: st.profile.createdAt || Date.now() } })),

        updateProfile: (p) => set((st) => ({ profile: { ...st.profile, ...p } })),

        updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),

        logPractice: (e) => {
          if (e.seconds < 5 && !e.completed) return [];
          const entry: LogEntry = { ...e, id: uid(), day: dayKey(new Date()) };
          set((st) => {
            const programs = { ...st.programs };
            const session = e.kind === 'session' ? SESSION_BY_ID[e.refId] : undefined;
            if (session?.program && e.completed) {
              const done = new Set(programs[session.program.id] ?? []);
              done.add(session.program.day);
              programs[session.program.id] = [...done].sort((a, b) => a - b);
            }
            return { history: [...st.history, entry].slice(-2000), programs };
          });
          return unlock();
        },

        toggleFavorite: (key) => {
          const on = !get().favorites.includes(key);
          set((st) => ({ favorites: on ? [key, ...st.favorites] : st.favorites.filter((f) => f !== key) }));
          return on;
        },

        addMood: (m) => {
          const now = Date.now();
          set((st) => ({ moods: [...st.moods, { ...m, id: uid(), at: now, day: dayKey(new Date(now)) }].slice(-1000) }));
          return unlock();
        },

        deleteMood: (id) => set((st) => ({ moods: st.moods.filter((m) => m.id !== id) })),

        addJournal: (j) => {
          const now = Date.now();
          set((st) => ({
            journal: [...st.journal, { ...j, id: uid(), at: now, day: dayKey(new Date(now)) }].slice(-1000),
          }));
          return unlock();
        },

        deleteJournal: (id) => set((st) => ({ journal: st.journal.filter((j) => j.id !== id) })),

        saveMix: (name, mix) => {
          const m: SavedMix = { id: uid(), name: name.trim() || 'Mi mezcla', mix, createdAt: Date.now() };
          set((st) => ({ mixes: [m, ...st.mixes].slice(0, 30) }));
          return m;
        },

        deleteMix: (id) => set((st) => ({ mixes: st.mixes.filter((m) => m.id !== id) })),

        exportData: () => {
          const { profile, settings, history, favorites, programs, moods, journal, mixes, achievements } = get();
          return JSON.stringify(
            {
              app: APP_ID,
              version: 1,
              exportedAt: new Date().toISOString(),
              data: { profile, settings, history, favorites, programs, moods, journal, mixes, achievements },
            },
            null,
            2,
          );
        },

        importData: (json) => {
          try {
            const parsed = JSON.parse(json) as { app?: string; data?: Partial<Data> };
            if ((parsed.app !== APP_ID && parsed.app !== 'mindflow') || !parsed.data) return false;
            const d = parsed.data;
            set((st) => ({
              profile: { ...st.profile, ...d.profile },
              settings: { ...st.settings, ...d.settings },
              history: Array.isArray(d.history) ? d.history : st.history,
              favorites: Array.isArray(d.favorites) ? d.favorites : st.favorites,
              programs: d.programs ?? st.programs,
              moods: Array.isArray(d.moods) ? d.moods : st.moods,
              journal: Array.isArray(d.journal) ? d.journal : st.journal,
              mixes: Array.isArray(d.mixes) ? d.mixes : st.mixes,
              achievements: d.achievements ?? st.achievements,
            }));
            return true;
          } catch {
            return false;
          }
        },

        resetAll: () => set({ ...DEFAULTS, profile: { ...DEFAULTS.profile, createdAt: Date.now() } }),

        markEliSeen: (placement) => set((st) => ({ eli: { ...st.eli, seen: { ...st.eli.seen, [placement]: Date.now() } } })),

        snoozeEli: (placement, days) =>
          set((st) => ({ eli: { ...st.eli, snoozed: { ...st.eli.snoozed, [placement]: Date.now() + days * 86_400_000 } } })),

        trackEliClick: (key) =>
          set((st) => ({ eli: { ...st.eli, clicks: { ...st.eli.clicks, [key]: (st.eli.clicks[key] ?? 0) + 1 }, lastClickAt: Date.now() } })),
      };
    },
    {
      name: STORAGE_KEY,
      version: 3,
      // The default home scene went from the pink "jardin" (v1) to the green lake "calma" (v2) to the
      // beach "playa" (v3). Almost everyone on an old default just kept it (a deliberate pick can't be
      // told apart), so move them to the current one.
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<Data>;
        const scene = s.settings?.sceneId;
        if (s.settings && ((version < 2 && scene === 'jardin') || (version < 3 && scene === 'calma'))) {
          s.settings = { ...s.settings, sceneId: 'playa' };
        }
        return s as Data;
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        profile: s.profile,
        settings: s.settings,
        history: s.history,
        favorites: s.favorites,
        programs: s.programs,
        moods: s.moods,
        journal: s.journal,
        mixes: s.mixes,
        achievements: s.achievements,
        eli: s.eli,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Data>;
        return {
          ...current,
          ...p,
          profile: { ...current.profile, ...p.profile },
          eli: { ...current.eli, ...p.eli },
          settings: {
            ...current.settings,
            ...p.settings,
            timer: { ...current.settings.timer, ...p.settings?.timer },
            breathe: { ...current.settings.breathe, ...p.settings?.breathe },
          },
        };
      },
    },
  ),
);

export const favKey = {
  session: (id: string) => `session:${id}`,
  music: (id: string) => `music:${id}`,
  mix: (id: string) => `mix:${id}`,
};
