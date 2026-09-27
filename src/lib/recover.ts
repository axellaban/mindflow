/** Takes the loading screen away: once the app has drawn its first frame, or when it failed to. */
export function hideSplash(): void {
  const splash = document.getElementById('splash');
  if (!splash || splash.classList.contains('gone')) return;
  requestAnimationFrame(() => splash.classList.add('gone'));
  setTimeout(() => splash.remove(), 1200);
}

/**
 * Reloads the page, at most once a minute, so a file that keeps failing can never trap anyone in a
 * loop of reloads. Returns whether it reloaded.
 */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem('mf-reload-at') || 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem('mf-reload-at', String(Date.now()));
  } catch {
    return false;
  }
  location.reload();
  return true;
}
