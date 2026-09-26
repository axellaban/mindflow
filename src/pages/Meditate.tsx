import { Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { CoverArt } from '@/art/CoverArt';
import { ProgramCard, Rail, SessionCard, SessionRow } from '@/components/cards';
import { IconButton } from '@/components/ui/Button';
import { Chip, SectionTitle } from '@/components/ui/controls';
import { CATEGORIES, DAILY_POOL, SESSIONS } from '@/content/catalog';
import { dailyFor } from '@/content/recommend';
import type { CategoryId } from '@/content/types';
import { haptic } from '@/lib/device';
import { useProgramProgress } from '@/lib/hooks';
import { PageHeader } from './PageHeader';

export function Meditate() {
  const [cat, setCat] = useState<CategoryId | 'todo'>('todo');
  const programs = useProgramProgress();
  const navigate = useNavigate();
  const meditations = useMemo(() => SESSIONS.filter((s) => s.kind === 'meditation'), []);
  const short = useMemo(() => meditations.filter((s) => s.duration <= 5.5 * 60), [meditations]);
  const today = dailyFor();
  const filtered = useMemo(() => (cat === 'todo' ? [] : meditations.filter((s) => s.categories.includes(cat))), [cat, meditations]);

  return (
    <div className="pb-12">
      <PageHeader
        title="Meditar"
        subtitle="Prácticas guiadas para cada momento"
        action={
          <IconButton label="Buscar" onClick={() => navigate('/buscar')}>
            <Search className="size-5" />
          </IconButton>
        }
      />
      <div className="no-scrollbar -mt-1 flex gap-2 overflow-x-auto px-5 pb-1 md:px-0">
        <Chip active={cat === 'todo'} onClick={() => setCat('todo')}>
          Todo
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
            {c.name}
          </Chip>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {cat === 'todo' ? (
          <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 space-y-11">
            <section>
              <SectionTitle title="Programas" />
              <Rail>
                {programs.map((p) => (
                  <ProgramCard key={p.program.id} progress={p} />
                ))}
              </Rail>
            </section>

            <section>
              <SectionTitle title="La pausa del día" />
              <p className="-mt-2 mb-4 px-5 text-[14px] text-3 md:px-0">
                Una reflexión nueva cada día. Hoy: <span className="text-2">{today.daily?.theme}</span>
              </p>
              <Rail>
                {[today, ...DAILY_POOL.filter((d) => d.id !== today.id)].map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </Rail>
            </section>

            <section>
              <SectionTitle title="Breves · 5 minutos o menos" />
              <Rail>
                {short.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </Rail>
            </section>

            <section>
              <SectionTitle title="Por tema" />
              <div className="grid grid-cols-2 gap-3 px-5 sm:grid-cols-3 md:px-0 lg:grid-cols-4">
                {CATEGORIES.map((c) => (
                  <Link key={c.id} to={`/tema/${c.id}`} onClick={() => haptic(5)} className="group relative block overflow-hidden rounded-[24px]">
                    <CoverArt spec={c.art} ratio={1.5} rounded="rounded-[24px]" className="aspect-[1.5] w-full transition-transform duration-700 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3.5">
                      <p className="text-[16px] font-semibold">{c.name}</p>
                      <p className="line-clamp-1 text-[12px] text-2">{c.blurb}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle title="Todas las meditaciones" />
              <div className="grid grid-cols-1 gap-1 px-3 md:grid-cols-2 md:px-0 lg:gap-2">
                {meditations
                  .filter((s) => !s.daily && !s.program)
                  .map((s) => (
                    <SessionRow key={s.id} session={s} />
                  ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div key={cat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8">
            <p className="mb-5 px-5 text-[15px] text-2 md:px-0">
              {CATEGORIES.find((c) => c.id === cat)?.blurb} · {filtered.length} prácticas
            </p>
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-6 px-5 sm:grid-cols-3 md:px-0 lg:grid-cols-5">
              {filtered.map((s) => (
                <SessionCard key={s.id} session={s} className="w-full md:w-full" />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
