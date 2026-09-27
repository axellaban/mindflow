import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';

/** The welcome: a reload would lose the answers given so far. */
const WELCOME = /^\/bienvenida/;

/** Nothing is playing, no practice is running and nobody is halfway through the welcome. */
function quiet(): boolean {
  return !usePlayer.getState().item && !useUI.getState().practicing && !WELCOME.test(location.pathname);
}

/**
 * New versions install in the background and take over when nobody would notice: right after
 * the app opens or when it goes to the background, and never in the middle of a practice.
 * Installed apps can stay open for days, so they also look for updates whenever they come back.
 */
export function setupUpdates(): void {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  let pending = false;
  let shownAt = performance.now();

  const reloadIfQuiet = () => {
    if (!pending || !quiet()) return;
    const justOpened = performance.now() - shownAt < 10_000;
    if (document.visibilityState === 'hidden' || justOpened) {
      pending = false;
      location.reload();
    }
  };

  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      // after the page has loaded, so caching the app for offline use never slows the first visit
      immediate: false,
      onNeedReload() {
        pending = true;
        reloadIfQuiet();
      },
      onRegisteredSW(_url, registration) {
        if (!registration) return;
        const check = () => {
          if (navigator.onLine) void registration.update().catch(() => undefined);
        };
        setInterval(check, 60 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState !== 'visible') return;
          shownAt = performance.now();
          check();
        });
      },
    });
  });

  document.addEventListener('visibilitychange', reloadIfQuiet);
  usePlayer.subscribe((s, prev) => {
    if (prev.item && !s.item) reloadIfQuiet();
  });
  useUI.subscribe((s, prev) => {
    if (prev.practicing && !s.practicing) reloadIfQuiet();
  });

  // A screen from an older version that is gone from the server: load the current one instead.
  window.addEventListener('vite:preloadError', (e) => {
    e.preventDefault();
    location.reload();
  });
}
