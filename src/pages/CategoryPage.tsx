import { useParams } from 'react-router';
import { CoverArt } from '@/art/CoverArt';
import { ProgramCard, Rail, SessionCard } from '@/components/cards';
import { CATEGORY_BY_ID, PROGRAMS, SESSIONS } from '@/content/catalog';
import type { CategoryId } from '@/content/types';
import { programProgress } from '@/lib/hooks';
import { useAppStore } from '@/store/app';
import { NotFound } from './NotFound';
import { PageHeader } from './PageHeader';

const CAT_PROGRAMS: Partial<Record<CategoryId, string>> = {
  ansiedad: 'calma-la-ansiedad',
  sueno: 'duerme-profundo',
  principiantes: 'aprende-a-meditar',
  estres: 'aprende-a-meditar',
};

export function CategoryPage() {
  const { id } = useParams();
  const cat = CATEGORY_BY_ID[id as CategoryId];
  const programs = useAppStore((s) => s.programs);
  if (!cat) return <NotFound />;
  const sessions = SESSIONS.filter((s) => s.categories.includes(cat.id));
  const program = PROGRAMS.find((p) => p.id === CAT_PROGRAMS[cat.id]);

  return (
    <div className="pb-12">
      <PageHeader title={cat.name} subtitle={cat.blurb} back />
      <div className="px-5 md:px-0">
        <CoverArt spec={cat.art} ratio={2.6} rounded="rounded-[28px]" className="aspect-[2.6] w-full" />
      </div>
      {program && (
        <section className="mt-9">
          <Rail>
            <ProgramCard progress={programProgress(program, programs[program.id] ?? [])} />
          </Rail>
        </section>
      )}
      <section className="mt-9 grid grid-cols-2 gap-x-3.5 gap-y-6 px-5 sm:grid-cols-3 md:px-0 lg:grid-cols-5">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} className="w-full md:w-full" />
        ))}
      </section>
    </div>
  );
}
