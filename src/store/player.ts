import { create } from 'zustand';
import { coverImage } from '@/art/artwork';
import { engine } from '@/audio/engine';
import { clearMediaSession, narration, setMediaPlayback, setMediaSession } from '@/audio/narration';
import type { AchievementId } from '@/content/achievements';
import { NARRATORS, SESSION_BY_ID, audioUrl, captionsUrl, sessionKindLabel } from '@/content/catalog';
import { BED_BY_ID, MUSIC_BY_ID } from '@/content/sounds';
import type { ArtSpec, BedId, Mix, MusicId } from '@/content/types';
import { useAppStore } from './app';
import { useUI } from './ui';

export interface Caption {
  s: number;
  e: number;
  t: string;
}

export type PlayerItem =
  | { type: 'session'; id: string }
  | { type: 'music'; id: MusicId }
  | { type: 'mix'; id: string; name: string; mix: Mix; art: ArtSpec };

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended';

interface PlayerState {
  item: PlayerItem | null;
  status: PlayerStatus;
  position: number;
  duration: number;
  expanded: boolean;
  bed: BedId;
  volume: number;
  sleepTimerEnd: number | null;
  captions: Caption[];
  listened: number;
  completedAchievements: AchievementId[];
  error: string | null;

  playSession: (id: string) => void;
  /** Prepare a session without starting audio (deep links: playback needs a tap). */
  openSession: (id: string) => void;
  playMusic: (id: MusicId) => void;
  playMix: (m: { id: string; name: string; mix: Mix; art: ArtSpec }) => void;
  updateMix: (mix: Mix, meta?: { name: string; art: ArtSpec }) => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  close: () => void;
  setExpanded: (v: boolean) => void;
  setBed: (bed: BedId) => void;
  setVolume: (v: number) => void;
  setSleepTimer: (minutes: number | null) => void;
}

let tick: ReturnType<typeof setInterval> | null = null;
let sleepTimeout: ReturnType<typeof setTimeout> | null = null;
let sleepFadeTimeout: ReturnType<typeof setTimeout> | null = null;
let afterEndTimeout: ReturnType<typeof setTimeout> | null = null;
let lastTime = 0;
let logged = false;

function clearTimers(): void {
  if (tick) clearInterval(tick);
  tick = null;
  if (sleepTimeout) clearTimeout(sleepTimeout);
  if (sleepFadeTimeout) clearTimeout(sleepFadeTimeout);
  if (afterEndTimeout) clearTimeout(afterEndTimeout);
  sleepTimeout = sleepFadeTimeout = afterEndTimeout = null;
}

function itemTitle(item: PlayerItem): { title: string; artist: string; album: string } {
  if (item.type === 'session') {
    const s = SESSION_BY_ID[item.id]!;
    return { title: s.title, artist: `Mindfulness by Eli · voz de ${NARRATORS[s.narrator].name}`, album: sessionKindLabel(s) };
  }
  if (item.type === 'music') {
    const m = MUSIC_BY_ID[item.id];
    return { title: m.title, artist: 'Mindfulness by Eli', album: m.subtitle };
  }
  return { title: item.name, artist: 'Mindfulness by Eli', album: 'Paisaje sonoro' };
}

export const usePlayer = create<PlayerState>()((set, get) => {
  const logCurrent = (completed: boolean) => {
    const { item, listened } = get();
    if (!item || logged) return;
    const app = useAppStore.getState();
    let fresh: AchievementId[] = [];
    if (item.type === 'session') {
      const s = SESSION_BY_ID[item.id];
      if (!s) return;
      if (!completed && listened < 30) return;
      // skipping to the end doesn't count as finishing a session
      const really = completed && listened >= Math.min(s.duration * 0.5, Math.max(60, s.duration - 45));
      fresh = app.logPractice({
        kind: 'session',
        refId: s.id,
        title: s.title,
        at: Date.now() - listened * 1000,
        seconds: Math.round(listened),
        completed: really,
      });
    } else {
      if (listened < 60) return;
      const title = item.type === 'music' ? MUSIC_BY_ID[item.id].title : item.name;
      fresh = app.logPractice({
        kind: item.type === 'music' ? 'music' : 'mix',
        refId: item.id,
        title,
        at: Date.now() - listened * 1000,
        seconds: Math.round(Math.min(listened, 30 * 60)),
        completed: listened >= 5 * 60,
      });
    }
    logged = true;
    if (fresh.length) {
      set({ completedAchievements: fresh });
      useUI.getState().celebrate(fresh);
    }
  };

  const startBed = (bed: BedId) => {
    engine.setLayersVolume(get().volume, 0.3);
    engine.setMix(BED_BY_ID[bed]?.mix ?? {}, 2.2);
  };

  const onTime = () => {
    const t = narration.time;
    const d = narration.duration || get().duration;
    const delta = t - lastTime;
    lastTime = t;
    const patch: Partial<PlayerState> = { position: t, duration: d };
    if (!narration.paused && delta > 0 && delta < 2) patch.listened = get().listened + delta;
    set(patch);
    setMediaPlayback(narration.paused ? 'paused' : 'playing', { duration: d, position: t });
  };

  const onEnded = () => {
    const { item } = get();
    if (!item || item.type !== 'session') return;
    const s = SESSION_BY_ID[item.id];
    set({ status: 'ended', position: get().duration });
    logCurrent(true);
    setMediaPlayback('paused');
    if (s?.sleep) {
      // keep the background playing, then fade it out gently
      const minutes = useAppStore.getState().settings.sleepFadeMinutes;
      afterEndTimeout = setTimeout(() => {
        engine.fadeMaster(0, 45);
        afterEndTimeout = setTimeout(() => {
          engine.stopAll(0.5);
          engine.releaseKeepAlive();
        }, 46_000);
      }, minutes * 60_000);
    } else {
      engine.stopAll(6);
      set({ expanded: true });
    }
  };

  if (typeof window !== 'undefined') {
    narration.el.addEventListener('timeupdate', onTime);
    narration.el.addEventListener('ended', onEnded);
    narration.el.addEventListener('playing', () => {
      if (get().item?.type === 'session') set({ status: 'playing', error: null });
    });
    narration.el.addEventListener('waiting', () => {
      if (get().item?.type === 'session' && get().status === 'playing') set({ status: 'loading' });
    });
    narration.el.addEventListener('pause', () => {
      const st = get();
      if (st.item?.type === 'session' && st.status !== 'ended' && !narration.el.ended) {
        set({ status: 'paused' });
        setMediaPlayback('paused');
      }
    });
    narration.el.addEventListener('error', () => {
      if (get().item?.type === 'session' && narration.el.getAttribute('src')) {
        set({ status: 'paused', error: 'No pudimos cargar el audio. Revisa tu conexión e inténtalo de nuevo.' });
      }
    });
  }

  const beginTicker = () => {
    if (tick) clearInterval(tick);
    tick = setInterval(() => {
      const st = get();
      if (st.item && st.item.type !== 'session' && st.status === 'playing') {
        set({ listened: st.listened + 1, position: st.position + 1 });
      }
    }, 1000);
  };

  const setMixMediaSession = (item: Extract<PlayerItem, { type: 'mix' }>) =>
    setMediaSession(
      itemTitle(item),
      {
        play: () => get().resume(),
        pause: () => get().pause(),
        stop: () => get().close(),
      },
      coverImage(item.art),
    );

  const resetFor = (item: PlayerItem) => {
    const prev = get().item;
    if (prev) logCurrent(false);
    clearTimers();
    logged = false;
    lastTime = 0;
    engine.fadeMaster(1, 0.2);
    set({
      item,
      position: 0,
      duration: 0,
      listened: 0,
      captions: [],
      sleepTimerEnd: null,
      completedAchievements: [],
      error: null,
    });
  };

  return {
    item: null,
    status: 'idle',
    position: 0,
    duration: 0,
    expanded: false,
    bed: 'pad',
    volume: 0.55,
    sleepTimerEnd: null,
    captions: [],
    listened: 0,
    completedAchievements: [],
    error: null,

    playSession: (id) => {
      const s = SESSION_BY_ID[id];
      if (!s) return;
      // audio must start inside the user gesture: do the synchronous work first
      engine.unlock(false);
      resetFor({ type: 'session', id });
      narration.load(audioUrl(id));
      const p = narration.play();
      const volume = useAppStore.getState().settings.bedVolume;
      set({ status: 'loading', duration: s.duration, expanded: true, bed: s.bed, volume });
      startBed(s.bed);
      p.then(
        () => set({ status: 'playing' }),
        (err: DOMException) => {
          if (err?.name === 'AbortError') return;
          set({ status: 'paused' });
        },
      );
      setMediaSession(itemTitle({ type: 'session', id }), {
        play: () => get().resume(),
        pause: () => get().pause(),
        stop: () => get().close(),
        seekbackward: () => get().skip(-15),
        seekforward: () => get().skip(15),
        seekto: (d) => d.seekTime != null && get().seek(d.seekTime),
      }, coverImage(s.art));
      fetch(captionsUrl(id))
        .then((r) => (r.ok ? r.json() : null))
        .then((doc: { captions: Caption[] } | null) => {
          if (doc && get().item?.type === 'session' && (get().item as { id: string }).id === id) set({ captions: doc.captions });
        })
        .catch(() => undefined);
    },

    openSession: (id) => {
      const s = SESSION_BY_ID[id];
      if (!s) return;
      resetFor({ type: 'session', id });
      narration.load(audioUrl(id));
      const volume = useAppStore.getState().settings.bedVolume;
      set({ status: 'paused', duration: s.duration, expanded: true, bed: s.bed, volume });
      setMediaSession(itemTitle({ type: 'session', id }), {
        play: () => get().resume(),
        pause: () => get().pause(),
        stop: () => get().close(),
        seekbackward: () => get().skip(-15),
        seekforward: () => get().skip(15),
        seekto: (d) => d.seekTime != null && get().seek(d.seekTime),
      }, coverImage(s.art));
      fetch(captionsUrl(id))
        .then((r) => (r.ok ? r.json() : null))
        .then((doc: { captions: Caption[] } | null) => {
          if (doc && get().item?.type === 'session' && (get().item as { id: string }).id === id) set({ captions: doc.captions });
        })
        .catch(() => undefined);
    },

    playMusic: (id) => {
      engine.unlock();
      narration.stop();
      resetFor({ type: 'music', id });
      set({ status: 'playing', expanded: true, volume: 0.9 });
      engine.setLayersVolume(0.9, 0.3);
      engine.setMix({ [id]: 1 }, 2.5);
      beginTicker();
      setMediaSession(itemTitle({ type: 'music', id }), {
        play: () => get().resume(),
        pause: () => get().pause(),
        stop: () => get().close(),
      }, coverImage(MUSIC_BY_ID[id].art));
      setMediaPlayback('playing');
    },

    playMix: (m) => {
      engine.unlock();
      narration.stop();
      resetFor({ type: 'mix', ...m });
      set({ status: 'playing', expanded: false, volume: 0.9 });
      engine.setLayersVolume(0.9, 0.3);
      engine.setMix(m.mix, 2);
      beginTicker();
      setMixMediaSession({ type: 'mix', ...m });
      setMediaPlayback('playing');
    },

    updateMix: (mix, meta) => {
      const { item } = get();
      if (item?.type !== 'mix') return;
      const next: PlayerItem = meta ? { ...item, id: 'custom', mix, ...meta } : { ...item, mix };
      set({ item: next });
      if (get().status === 'playing') engine.setMix(mix, 0.6);
      if (meta) setMixMediaSession(next);
    },

    toggle: () => {
      const { status } = get();
      if (status === 'playing' || status === 'loading') get().pause();
      else get().resume();
    },

    pause: () => {
      const { item } = get();
      if (!item) return;
      if (item.type === 'session') narration.pause();
      engine.setLayersVolume(0, 0.6);
      set({ status: get().status === 'ended' ? 'ended' : 'paused' });
      setMediaPlayback('paused');
    },

    resume: () => {
      const { item, status, volume, bed } = get();
      if (!item) return;
      if (afterEndTimeout) {
        clearTimeout(afterEndTimeout);
        afterEndTimeout = null;
      }
      engine.unlock(item.type !== 'session');
      engine.fadeMaster(1, 0.2);
      if (item.type === 'session') {
        if (status === 'ended') {
          // replay from the start
          logged = false;
          set({ listened: 0 });
          narration.seek(0);
          startBed(bed);
        }
        void narration.play().catch(() => set({ status: 'paused' }));
        set({ status: 'loading' });
        engine.setMix(BED_BY_ID[bed]?.mix ?? {}, 1.5);
        engine.setLayersVolume(volume, 0.8);
      } else {
        const mix = item.type === 'music' ? { [item.id]: 1 } : item.mix;
        engine.setMix(mix, 1.2);
        engine.setLayersVolume(volume, 0.8);
        set({ status: 'playing' });
        beginTicker();
      }
      setMediaPlayback('playing');
    },

    seek: (t) => {
      if (get().item?.type !== 'session') return;
      narration.seek(t);
      lastTime = narration.time;
      set({ position: t, status: get().status === 'ended' ? 'paused' : get().status });
    },

    skip: (delta) => get().seek(Math.max(0, get().position + delta)),

    close: () => {
      logCurrent(get().status === 'ended');
      clearTimers();
      narration.stop();
      engine.stopAll(1.2);
      engine.releaseKeepAlive();
      clearMediaSession();
      set({ item: null, status: 'idle', expanded: false, position: 0, duration: 0, sleepTimerEnd: null, captions: [] });
    },

    setExpanded: (v) => set({ expanded: v }),

    setBed: (bed) => {
      set({ bed });
      if (get().status !== 'paused') engine.setMix(BED_BY_ID[bed]?.mix ?? {}, 1.5);
    },

    setVolume: (v) => {
      set({ volume: v });
      if (get().status !== 'paused') engine.setLayersVolume(v, 0.15);
      if (get().item?.type === 'session') useAppStore.getState().updateSettings({ bedVolume: v });
    },

    setSleepTimer: (minutes) => {
      if (sleepTimeout) clearTimeout(sleepTimeout);
      if (sleepFadeTimeout) clearTimeout(sleepFadeTimeout);
      sleepTimeout = sleepFadeTimeout = null;
      engine.fadeMaster(1, 0.3);
      if (!minutes) {
        set({ sleepTimerEnd: null });
        return;
      }
      const ms = minutes * 60_000;
      set({ sleepTimerEnd: Date.now() + ms });
      sleepFadeTimeout = setTimeout(() => engine.fadeMaster(0, 40), Math.max(0, ms - 40_000));
      sleepTimeout = setTimeout(() => {
        get().pause();
        engine.fadeMaster(1, 0.1);
        set({ sleepTimerEnd: null });
      }, ms);
    },
  };
});
