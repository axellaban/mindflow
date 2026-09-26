import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { MoodChart } from '@/components/MoodChart';
import { Button, IconButton } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/controls';
import { MoodOrb } from '@/features/checkin/CheckInSheet';
import { FEELINGS, JOURNAL_PROMPTS, MOODS } from '@/content/journal';
import { dayNumber, relativeDay } from '@/lib/time';
import { useAppStore } from '@/store/app';
import { useUI } from '@/store/ui';
import { PageHeader } from './PageHeader';

type Entry =
  | { type: 'mood'; id: string; at: number; day: string; level: 1 | 2 | 3 | 4 | 5; feelings: string[]; note?: string }
  | { type: 'journal'; id: string; at: number; day: string; prompt: string; text: string };

export function JournalPage() {
  const moods = useAppStore((s) => s.moods);
  const journal = useAppStore((s) => s.journal);
  const addJournal = useAppStore((s) => s.addJournal);
  const deleteMood = useAppStore((s) => s.deleteMood);
  const deleteJournal = useAppStore((s) => s.deleteJournal);
  const openCheckIn = useUI((s) => s.openCheckIn);
  const [range, setRange] = useState<'14' | '30'>('14');
  const [promptIdx, setPromptIdx] = useState(dayNumber());
  const [text, setText] = useState('');
  const prompt = JOURNAL_PROMPTS[promptIdx % JOURNAL_PROMPTS.length]!;

  const entries = useMemo(() => {
    const all: Entry[] = [
      ...moods.map((m) => ({ type: 'mood' as const, id: m.id, at: m.at, day: m.day, level: m.level, feelings: m.feelings, note: m.note })),
      ...journal.map((j) => ({ type: 'journal' as const, id: j.id, at: j.at, day: j.day, prompt: j.prompt, text: j.text })),
    ].sort((a, b) => b.at - a.at);
    const groups = new Map<string, Entry[]>();
    for (const e of all) {
      const g = groups.get(e.day) ?? [];
      g.push(e);
      groups.set(e.day, g);
    }
    return [...groups.entries()];
  }, [moods, journal]);

  const save = () => {
    if (!text.trim()) return;
    const fresh = addJournal({ prompt, text: text.trim() });
    if (fresh.length) useUI.getState().celebrate(fresh);
    setText('');
    useUI.getState().toast('Guardado en tu diario', 'success');
  };

  return (
    <div className="pb-12">
      <PageHeader
        title="Diario"
        subtitle="Tu espacio para registrar cómo estás. Solo vos podés verlo."
        back
        action={
          <Button size="sm" variant="secondary" icon={<Plus className="size-4" />} onClick={() => openCheckIn(true)}>
            Registrar ánimo
          </Button>
        }
      />

      <section className="px-5 md:px-0">
        <div className="glass rounded-[28px] p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[21px]">Tu ánimo</h2>
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: '14', label: '14 días' },
                { value: '30', label: '30 días' },
              ]}
            />
          </div>
          <MoodChart moods={moods} days={Number(range)} />
        </div>
      </section>

      <section className="mt-8 px-5 md:px-0">
        <div className="rounded-[28px] border border-white/8 bg-gradient-to-br from-ink-700/50 to-ink-800/40 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold tracking-[0.14em] text-3 uppercase">Pregunta para hoy</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={prompt}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-1.5 font-display text-[22px] leading-snug"
                >
                  {prompt}
                </motion.p>
              </AnimatePresence>
            </div>
            <IconButton label="Otra pregunta" size="sm" variant="plain" onClick={() => setPromptIdx((i) => i + 1)}>
              <RefreshCw className="size-4" />
            </IconButton>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="Escribí lo que surja…"
            className="mt-4 w-full resize-none rounded-3xl border border-white/10 bg-ink-900/40 p-4 text-[16px] leading-relaxed outline-none placeholder:text-mist-50/35 focus:border-blush-300/50"
          />
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={save} disabled={!text.trim()}>
              Guardar
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-10 px-5 md:px-0">
        {entries.length === 0 ? (
          <p className="text-center text-[15px] text-3">Todavía no hay registros. Empezá con un check-in de ánimo o respondiendo la pregunta de hoy.</p>
        ) : (
          <div className="space-y-8">
            {entries.map(([day, list]) => (
              <div key={day}>
                <p className="mb-3 text-[13px] font-bold tracking-[0.12em] text-3 uppercase">{relativeDay(day)}</p>
                <div className="space-y-2.5">
                  {list.map((e) => (
                    <motion.div layout key={e.id} className="group glass relative rounded-3xl p-4">
                      {e.type === 'mood' ? (
                        <div className="flex items-start gap-3">
                          <MoodOrb level={e.level} size={34} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold">
                              {MOODS[e.level - 1]!.label}
                              <span className="ml-2 text-[12px] font-normal text-3">
                                {new Date(e.at).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </p>
                            {e.feelings.length > 0 && (
                              <p className="mt-0.5 text-[13.5px] text-2">
                                {e.feelings.map((f) => FEELINGS.find((x) => x.id === f)?.label ?? f).join(' · ')}
                              </p>
                            )}
                            {e.note && <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap text-mist-50/90">{e.note}</p>}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[13px] font-semibold text-3">{e.prompt}</p>
                          <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-wrap">{e.text}</p>
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label="Eliminar registro"
                        onClick={() => (e.type === 'mood' ? deleteMood(e.id) : deleteJournal(e.id))}
                        className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full text-3 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/8 focus:opacity-100 max-md:opacity-60"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
