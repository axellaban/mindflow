/**
 * Single, reused <audio> element for narrated sessions. Reusing one element is
 * important on iOS: once it has been played from a user gesture, later
 * programmatic plays are allowed and it keeps playing with the screen locked.
 */
class Narration {
  readonly el: HTMLAudioElement;

  constructor() {
    this.el = new Audio();
    this.el.preload = 'auto';
    this.el.setAttribute('playsinline', '');
  }

  /** Loads `url`; if it is already loaded, rewinds instead. */
  load(url: string): void {
    if (this.el.src.endsWith(url)) {
      this.el.currentTime = 0;
      return;
    }
    this.el.src = url;
    this.el.load();
  }

  play(): Promise<void> {
    return this.el.play();
  }

  pause(): void {
    this.el.pause();
  }

  stop(): void {
    this.el.pause();
    this.el.removeAttribute('src');
    this.el.load();
  }

  seek(t: number): void {
    const d = this.el.duration;
    this.el.currentTime = Math.max(0, Number.isFinite(d) ? Math.min(d - 0.25, t) : t);
  }

  get time(): number {
    return this.el.currentTime || 0;
  }

  get duration(): number {
    return Number.isFinite(this.el.duration) ? this.el.duration : 0;
  }

  get paused(): boolean {
    return this.el.paused;
  }
}

export const narration = typeof window !== 'undefined' ? new Narration() : (null as unknown as Narration);

let generation = 0;

export function setMediaSession(
  meta: { title: string; artist: string; album: string },
  handlers: Partial<Record<MediaSessionAction, MediaSessionActionHandler | null>>,
  /** Resolves to the cover image once it's drawn; the app icon is shown until then. */
  cover?: Promise<string | null>,
): void {
  if (!('mediaSession' in navigator)) return;
  const gen = ++generation;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      ...meta,
      artwork: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    const all: MediaSessionAction[] = ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'seekto'];
    for (const action of all) {
      try {
        navigator.mediaSession.setActionHandler(action, handlers[action] ?? null);
      } catch {
        /* unsupported action */
      }
    }
  } catch {
    /* noop */
  }
  void cover?.then((src) => {
    if (!src || gen !== generation) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ ...meta, artwork: [{ src, sizes: '512x512', type: 'image/jpeg' }] });
    } catch {
      /* noop */
    }
  });
}

export function setMediaPlayback(state: MediaSessionPlaybackState, position?: { duration: number; position: number }): void {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.playbackState = state;
    if (position && position.duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: position.duration,
        position: Math.min(position.position, position.duration),
        playbackRate: 1,
      });
    }
  } catch {
    /* noop */
  }
}

export function clearMediaSession(): void {
  if (!('mediaSession' in navigator)) return;
  generation++;
  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
  } catch {
    /* noop */
  }
}
