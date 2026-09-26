/** Local-calendar helpers. Days are identified by `YYYY-MM-DD` in the user's timezone. */

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Whole days since the Unix epoch in local time (stable daily rotation). */
export function dayNumber(d: Date = new Date()): number {
  const local = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(local / 86_400_000);
}

export type DayPart = 'madrugada' | 'mañana' | 'tarde' | 'noche';

export function dayPart(d: Date = new Date()): DayPart {
  const h = d.getHours();
  if (h < 5) return 'madrugada';
  if (h < 12) return 'mañana';
  if (h < 20) return 'tarde';
  return 'noche';
}

export function greeting(d: Date = new Date()): string {
  const part = dayPart(d);
  if (part === 'mañana') return 'Buenos días';
  if (part === 'tarde') return 'Buenas tardes';
  return 'Buenas noches';
}

export function isNightish(d: Date = new Date()): boolean {
  const h = d.getHours();
  return h >= 20 || h < 5;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function longDate(d: Date = new Date()): string {
  const w = WEEKDAYS[d.getDay()]!;
  return `${w[0]!.toUpperCase()}${w.slice(1)} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function monthName(month: number): string {
  const m = MONTHS[month]!;
  return m[0]!.toUpperCase() + m.slice(1);
}

export function shortWeekday(d: Date): string {
  return ['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()]!;
}

export function relativeDay(key: string, today = new Date()): string {
  const diff = Math.round((fromDayKey(dayKey(today)).getTime() - fromDayKey(key).getTime()) / 86_400_000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) {
    const w = WEEKDAYS[fromDayKey(key).getDay()]!;
    return w[0]!.toUpperCase() + w.slice(1);
  }
  const d = fromDayKey(key);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

/** "10 min", "1 h 5 min", "45 s" */
export function formatDuration(seconds: number, opts: { short?: boolean } = {}): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 min';
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const totalMin = Math.round(seconds / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (opts.short) return m ? `${h} h ${m}` : `${h} h`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** mm:ss or h:mm:ss for player clocks */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

export function formatMinutesTotal(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}`;
  const h = minutes / 60;
  return h < 10 ? h.toFixed(1).replace('.', ',') : String(Math.round(h));
}
