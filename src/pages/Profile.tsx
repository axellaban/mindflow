import { ChevronLeft, ChevronRight, Flame, Heart, NotebookPen, Settings, Sparkles, Timer, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CoverArt } from '@/art/CoverArt';
import { MoodChart } from '@/components/MoodChart';
import { MusicCard, Rail, SessionCard } from '@/components/cards';
import { IconButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { SectionTitle } from '@/components/ui/controls';
import { ACHIEVEMENTS } from '@/content/achievements';
import { SESSION_BY_ID } from '@/content/catalog';
import { MUSIC_BY_ID } from '@/content/sounds';
import type { MusicId } from '@/content/types';
import { EliInvite } from '@/features/eli/EliInvite';
import { useStats } from '@/lib/hooks';
import { longestStreak, minutesByDay } from '@/lib/stats';
import { dayKey, formatDuration, formatMinutesTotal, monthName, relativeDay } from '@/lib/time';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';
import { useUI } from '@/store/ui';

export function Profile() {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const history = useAppStore((s) => s.history);
  const moods = useAppStore((s) => s.moods);
  const favorites = useAppStore((s) => s.favorites);
  const unlocked = useAppStore((s) => s.achievements);
  const stats = useStats();
  const best = useMemo(() => longestStreak(stats.days), [stats.days]);
  const initial = (profile.name.trim()[0] ?? '✿').toUpperCase();
  const since = new Date(profile.createdAt);

  const favSessions = favorites.filter((f) => f.startsWith('session:')).map((f) => SESSION_BY_ID[f.slice(8)]).filter(Boolean);
  const favMusic = favorites.filter((f) => f.startsWith('music:')).map((f) => MUSIC_BY_ID[f.slice(6) as MusicId]).filter(Boolean);
  const recent = [...history].reverse().slice(0, 8);

  return (
    <div className="pb-12">
      <header className="px-5 pt-safe md:px-0 lg:pt-10">
        <div className="flex min-h-12 items-center justify-end gap-2 pt-2">
          <IconButton label="Diario" onClick={() => navigate('/diario')}>
            <NotebookPen className="size-5" />
          </IconButton>
          <IconButton label="Ajustes" onClick={() => navigate('/ajustes')}>
            <Settings className="size-5" />
          </IconButton>
        </div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex items-center gap-4">
          <div
            className="flex size-16 items-center justify-center rounded-full font-display text-[28px] text-ink-900"
            style={{ background: 'radial-gradient(circle at 35% 30%, #fffaf0, #f1dcbc 48%, #a8dcd5)' }}
          >
            {initial}
          </div>
          <div>
            <h1 className="font-display text-[32px] leading-tight md:text-[40px]">{profile.name.trim() || 'Tu espacio'}</h1>
            <p className="text-[14px] text-3">
              Practicando desde {monthName(since.getMonth()).toLowerCase()} de {since.getFullYear()}
            </p>
          </div>
        </motion.div>
      </header>

      <section className="mt-7 grid grid-cols-2 gap-3 px-5 md:grid-cols-4 md:px-0">
        <Stat icon={<Flame className="size-4.5 text-peach-300" />} value={String(stats.streak)} label={stats.streak === 1 ? 'día de racha' : 'días de racha'} />
        <Stat icon={<Timer className="size-4.5 text-blush-300" />} value={formatMinutesTotal(stats.minutes)} label={stats.minutes >= 60 ? 'horas de calma' : 'minutos de calma'} />
        <Stat icon={<Sparkles className="size-4.5 text-sage-300" />} value={String(stats.sessions)} label="prácticas" />
        <Stat icon={<Trophy className="size-4.5 text-gold-300" />} value={String(best)} label="mejor racha" />
      </section>

      <section className="mt-10 px-5 md:px-0">
        <Calendar />
      </section>

      <section className="mt-10 px-5 md:px-0">
        <div className="glass rounded-[28px] p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-[21px]">Tu ánimo</h2>
            <Link to="/diario" className="text-[13px] font-semibold text-2 hover:text-mist-50">
              Ver diario
            </Link>
          </div>
          <MoodChart moods={moods} days={14} />
        </div>
      </section>

      <section className="mt-10 px-5 md:px-0 lg:max-w-2xl">
        <EliInvite
          placement="profile"
          eyebrow="Sesiones 1:1 con Eli"
          title="Tu práctica, con acompañamiento"
          body={
            stats.sessions > 0
              ? `Llevás ${stats.sessions} ${stats.sessions === 1 ? 'práctica' : 'prácticas'}. Si querés profundizar, en una sesión 1:1 armamos juntas un camino a tu medida.`
              : 'Si querés empezar acompañada, en una sesión 1:1 armamos juntas un camino a tu medida.'
          }
          more
        />
      </section>

      <section className="mt-10">
        <SectionTitle title="Logros" action={<span className="text-[13px] text-3">{Object.keys(unlocked).length} de {ACHIEVEMENTS.length}</span>} />
        <div className="grid grid-cols-3 gap-2.5 px-5 sm:grid-cols-5 md:px-0">
          {ACHIEVEMENTS.map((a) => {
            const got = Boolean(unlocked[a.id]);
            const detail = got ? a.description : `Por desbloquear: ${a.goal}`;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => useUI.getState().toast(got ? `${a.title}: ${a.description}` : detail)}
                aria-label={`${a.title}. ${detail}`}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-3xl px-2 py-4 text-center transition-colors',
                  got ? 'bg-white/8 hover:bg-white/12' : 'bg-white/3 hover:bg-white/6',
                )}
                title={detail}
              >
                <span
                  className={cn('flex size-12 items-center justify-center rounded-full', got ? 'text-ink-900' : 'bg-white/6 text-mist-50/70')}
                  style={got ? { background: 'radial-gradient(circle at 35% 30%, #fffaf0, #f6deaf 48%, #7cc5bf)' } : undefined}
                >
                  <Icon name={a.icon} className="size-5.5" />
                </span>
                <span className={cn('text-[12px] leading-tight font-semibold', got ? 'text-mist-50' : 'text-mist-50/85')}>{a.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      {(favSessions.length > 0 || favMusic.length > 0) && (
        <section className="mt-10">
          <SectionTitle title="Favoritos" />
          <Rail>
            {favSessions.map((s) => s && <SessionCard key={s.id} session={s} />)}
            {favMusic.map((m) => m && <MusicCard key={m.id} music={m} />)}
          </Rail>
        </section>
      )}
      {favSessions.length === 0 && favMusic.length === 0 && (
        <section className="mx-5 mt-10 flex items-center gap-3 rounded-3xl bg-white/4 p-4 text-[14px] text-2 md:mx-0">
          <Heart className="size-5 shrink-0" />
          Guardá tus prácticas favoritas desde el menú del reproductor y van a aparecer acá.
        </section>
      )}

      {recent.length > 0 && (
        <section className="mt-10 px-5 md:px-0">
          <h2 className="mb-3 font-display text-[22px]">Historial</h2>
          <div className="divide-y divide-white/5">
            {recent.map((h) => {
              const s = h.kind === 'session' ? SESSION_BY_ID[h.refId] : undefined;
              return (
                <div key={h.id} className="flex items-center gap-3 py-3">
                  {s ? (
                    <CoverArt spec={s.art} rounded="rounded-xl" className="size-11 shrink-0" grain={false} />
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/6">
                      <Icon name={h.kind === 'breathe' ? 'Wind' : h.kind === 'timer' ? 'Timer' : 'AudioWaveform'} className="size-5 text-2" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{h.title}</p>
                    <p className="text-[12.5px] text-3">
                      {relativeDay(h.day)} · {formatDuration(h.seconds)}
                      {h.completed ? ' · completada' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center gap-2">{icon}</div>
      <p className="mt-3 font-display text-[32px] leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 text-[13px] text-3">{label}</p>
    </div>
  );
}

function Calendar() {
  const history = useAppStore((s) => s.history);
  const perDay = useMemo(() => minutesByDay(history), [history]);
  const [offset, setOffset] = useState(0);
  const base = new Date();
  const month = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = (month.getDay() + 6) % 7;
  const today = dayKey();
  const cells: Array<{ key: string; day: number } | null> = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysIn }, (_, i) => {
      const d = new Date(month.getFullYear(), month.getMonth(), i + 1);
      return { key: dayKey(d), day: i + 1 };
    }),
  ];
  const monthMinutes = cells.reduce((acc, c) => acc + (c ? (perDay.get(c.key) ?? 0) : 0), 0);
  const practiced = cells.filter((c) => c && (perDay.get(c.key) ?? 0) >= 1).length;

  return (
    <div className="glass rounded-[28px] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[21px]">
            {monthName(month.getMonth())} {month.getFullYear() !== base.getFullYear() ? month.getFullYear() : ''}
          </h2>
          <p className="text-[13px] text-3">
            {practiced} {practiced === 1 ? 'día' : 'días'} · {Math.round(monthMinutes)} min
          </p>
        </div>
        <div className="flex gap-1">
          <IconButton label="Mes anterior" size="sm" variant="plain" onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft className="size-4" />
          </IconButton>
          <IconButton label="Mes siguiente" size="sm" variant="plain" onClick={() => setOffset((o) => Math.min(0, o + 1))} disabled={offset === 0}>
            <ChevronRight className="size-4" />
          </IconButton>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <span key={d} className="text-[11px] font-semibold text-3">
            {d}
          </span>
        ))}
        {cells.map((c, i) =>
          c ? (
            <div key={c.key} className="flex justify-center">
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-full text-[13px] font-medium tabular-nums transition-colors',
                  (perDay.get(c.key) ?? 0) >= 1 ? 'bg-mist-50 font-semibold text-ink-900' : 'text-mist-50/85',
                  c.key === today && (perDay.get(c.key) ?? 0) < 1 && 'ring-1 ring-mist-50/60',
                )}
              >
                {c.day}
              </span>
            </div>
          ) : (
            <span key={`e${i}`} />
          ),
        )}
      </div>
    </div>
  );
}
