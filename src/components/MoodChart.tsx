import { useMemo } from 'react';
import { MOODS } from '@/content/journal';
import { addDays, dayKey, fromDayKey, shortWeekday } from '@/lib/time';
import type { MoodEntry } from '@/store/app';

/** Average mood per day over the last `days` days, drawn as a soft line with glowing dots. */
export function MoodChart({ moods, days = 14 }: { moods: MoodEntry[]; days?: number }) {
  const data = useMemo(() => {
    const today = new Date();
    const keys = Array.from({ length: days }, (_, i) => dayKey(addDays(today, i - days + 1)));
    const byDay = new Map<string, number[]>();
    for (const m of moods) {
      const arr = byDay.get(m.day) ?? [];
      arr.push(m.level);
      byDay.set(m.day, arr);
    }
    return keys.map((k) => {
      const arr = byDay.get(k);
      return { key: k, value: arr ? arr.reduce((a, b) => a + b, 0) / arr.length : null };
    });
  }, [moods, days]);

  const W = 320;
  const H = 120;
  const pad = 14;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (days - 1);
  const y = (v: number) => H - pad - ((v - 1) / 4) * (H - pad * 2);
  const pts = data.map((d, i) => (d.value == null ? null : ([x(i), y(d.value)] as const))).filter(Boolean) as Array<readonly [number, number]>;
  let path = '';
  pts.forEach(([px, py], i) => {
    if (i === 0) path = `M ${px} ${py}`;
    else {
      const [qx, qy] = pts[i - 1]!;
      const cx = (qx + px) / 2;
      path += ` C ${cx} ${qy}, ${cx} ${py}, ${px} ${py}`;
    }
  });
  const hasData = pts.length > 0;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label="Tu ánimo en los últimos días">
        <defs>
          <linearGradient id="mood-line" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={MOODS[4].color} />
            <stop offset="0.5" stopColor={MOODS[2].color} />
            <stop offset="1" stopColor={MOODS[0].color} />
          </linearGradient>
        </defs>
        {[1, 2, 3, 4, 5].map((v) => (
          <line key={v} x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} stroke="white" strokeOpacity={v === 3 ? 0.08 : 0.04} strokeDasharray="2 5" />
        ))}
        {hasData && <path d={path} fill="none" stroke="url(#mood-line)" strokeWidth="2.5" strokeLinecap="round" />}
        {data.map((d, i) =>
          d.value == null ? (
            <circle key={d.key} cx={x(i)} cy={H - pad} r="1.5" fill="white" fillOpacity="0.15" />
          ) : (
            <g key={d.key}>
              <circle cx={x(i)} cy={y(d.value)} r="7" fill={MOODS[Math.round(d.value) - 1]!.color} fillOpacity="0.18" />
              <circle cx={x(i)} cy={y(d.value)} r="3.6" fill={MOODS[Math.round(d.value) - 1]!.color} />
            </g>
          ),
        )}
        {data.map((d, i) =>
          i % (days > 14 ? 5 : 2) === (days - 1) % (days > 14 ? 5 : 2) ? (
            <text key={`t${d.key}`} x={x(i)} y={H + 14} textAnchor="middle" fontSize="9.5" fill="white" fillOpacity="0.4" fontFamily="inherit">
              {shortWeekday(fromDayKey(d.key))}
            </text>
          ) : null,
        )}
      </svg>
      {!hasData && <p className="-mt-16 mb-10 text-center text-[13px] text-3">Registrá cómo te sentís para ver tu evolución.</p>}
    </div>
  );
}
