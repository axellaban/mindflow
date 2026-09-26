import { Headphones } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { MusicCard, Rail } from '@/components/cards';
import { SectionTitle, Segmented } from '@/components/ui/controls';
import { MUSIC } from '@/content/sounds';
import { Mixer } from '@/features/mixer/Mixer';
import { PageHeader } from './PageHeader';

type Tab = 'mezclador' | 'musica';

export function Sounds() {
  const [tab, setTab] = useState<Tab>(() => (sessionStorage.getItem('mf-sounds-tab') as Tab) || 'mezclador');
  const change = (t: Tab) => {
    setTab(t);
    try {
      sessionStorage.setItem('mf-sounds-tab', t);
    } catch {
      /* private mode */
    }
  };
  return (
    <div className="pb-12">
      <PageHeader title="Sonidos" subtitle="Paisajes sonoros y música que nunca se repite" />
      <div className="px-5 md:px-0">
        <Segmented<Tab>
          value={tab}
          onChange={change}
          options={[
            { value: 'mezclador', label: 'Mezclador' },
            { value: 'musica', label: 'Música' },
          ]}
          className="w-full max-w-sm"
        />
      </div>
      <AnimatePresence mode="wait">
        {tab === 'mezclador' ? (
          <motion.div key="mix" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-7">
            <Mixer />
          </motion.div>
        ) : (
          <motion.div key="music" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 space-y-10">
            <section>
              <SectionTitle title="Para relajarte" />
              <Rail>
                {MUSIC.filter((m) => m.mood === 'relajar').map((m) => (
                  <MusicCard key={m.id} music={m} />
                ))}
              </Rail>
            </section>
            <section>
              <SectionTitle title="Para enfocarte" />
              <Rail>
                {MUSIC.filter((m) => m.mood === 'enfocar').map((m) => (
                  <MusicCard key={m.id} music={m} />
                ))}
              </Rail>
            </section>
            <section>
              <SectionTitle title="Para dormir" />
              <Rail>
                {MUSIC.filter((m) => m.mood === 'dormir').map((m) => (
                  <MusicCard key={m.id} music={m} />
                ))}
              </Rail>
            </section>
            <p className="mx-5 flex items-start gap-3 rounded-3xl bg-white/4 p-4 text-[13.5px] leading-relaxed text-2 md:mx-0">
              <Headphones className="mt-0.5 size-4 shrink-0" />
              Toda la música se genera en tiempo real: nunca se repite igual. Las ondas binaurales funcionan solo con auriculares.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
