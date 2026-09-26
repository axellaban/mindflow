import { useAppStore } from '@/store/app';

/** Gentle haptic tick where supported (Android/Chrome). iOS Safari ignores it silently. */
export function haptic(pattern: number | number[] = 8): void {
  if (!useAppStore.getState().settings.haptics) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
}

type Sentinel = { release: () => Promise<void>; addEventListener?: (t: string, cb: () => void) => void };
let sentinel: Sentinel | null = null;
let wanted = false;

async function acquire(): Promise<void> {
  try {
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock;
    if (!wl) return;
    sentinel = await wl.request('screen');
    sentinel.addEventListener?.('release', () => {
      sentinel = null;
    });
  } catch {
    sentinel = null;
  }
}

function onVisibility(): void {
  if (wanted && document.visibilityState === 'visible' && !sentinel) void acquire();
}

/** Keep the screen awake while a timer or breathing session runs (if the user allows it). */
export async function keepAwake(on: boolean): Promise<void> {
  wanted = on && useAppStore.getState().settings.keepAwake;
  if (wanted) {
    document.addEventListener('visibilitychange', onVisibility);
    if (!sentinel) await acquire();
  } else {
    document.removeEventListener('visibilitychange', onVisibility);
    const s = sentinel;
    sentinel = null;
    await s?.release().catch(() => undefined);
  }
}

export async function shareOrCopy(data: { title: string; text: string; url?: string }): Promise<'shared' | 'copied' | 'failed'> {
  const url = data.url ?? window.location.origin;
  try {
    if (navigator.share) {
      await navigator.share({ title: data.title, text: data.text, url });
      return 'shared';
    }
  } catch (err) {
    if ((err as DOMException)?.name === 'AbortError') return 'failed';
  }
  try {
    await navigator.clipboard.writeText(`${data.text}\n${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function downloadFile(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1500);
}

/** A daily recurring calendar event: works as a reminder on every platform, no server needed. */
export function reminderICS(time: string, appUrl: string): string {
  const [hh, mm] = time.split(':').map(Number);
  const start = new Date();
  start.setHours(hh ?? 8, mm ?? 0, 0, 0);
  if (start.getTime() < Date.now()) start.setDate(start.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const end = new Date(start.getTime() + 10 * 60_000);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CalmabyEli//Recordatorio//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:mindfulness-daily-${Date.now()}@mindfulness-by-eli.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:Tu momento de calma · CalmabyEli',
    `DESCRIPTION:Unos minutos para vos. Abrí CalmabyEli: ${appUrl}`,
    `URL:${appUrl}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Es tu momento de calma',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
