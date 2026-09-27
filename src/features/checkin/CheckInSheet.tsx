import { Play } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { CoverArt } from '@/art/CoverArt';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { FEELINGS, JOURNAL_PROMPTS, MOODS, type MoodLevel } from '@/content/journal';
import { forMood } from '@/content/recommend';
import { EliInvite } from '@/features/eli/EliInvite';
import { useEliInvite } from '@/features/eli/useEliInvite';
import { haptic } from '@/lib/device';
import { dayNumber, formatDuration } from '@/lib/time';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';

export function MoodOrb({ level, size = 44, selected }: { level: MoodLevel; size?: number; selected?: boolean }) {
  const m = MOODS[level - 1]!;
  return (
    <span
      className={cn('block rounded-full transition-transform duration-300', selected && 'scale-110')}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, #ffffff, ${m.color} 58%, ${m.color}cc)`,
        boxShadow: selected ? `0 0 0 2px var(--color-ink-800), 0 0 0 4px ${m.color}, 0 10px 30px -6px ${m.color}` : `0 8px 24px -10px ${m.color}`,
      }}
    />
  );
}

export function CheckInSheet() {
  const open = useUI((s) => s.checkInOpen);
  const preset = useUI((s) => s.checkInLevel);
  const setOpen = useUI((s) => s.openCheckIn);
  const addMood = useAppStore((s) => s.addMood);
  const addJournal = useAppStore((s) => s.addJournal);
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<MoodLevel | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const prompt = useMemo(() => JOURNAL_PROMPTS[dayNumber() % JOURNAL_PROMPTS.length]!, []);
  const suggestion = level ? forMood(level, feelings) : undefined;

  useEffect(() => {
    if (open) {
      setStep(preset ? 1 : 0);
      setLevel(preset ?? null);
      setFeelings([]);
      setNote('');
    }
  }, [open, preset]);

  const close = () => setOpen(false);

  const save = () => {
    if (!level) return;
    const fresh = addMood({ level, feelings, note: note.trim() || undefined, source: 'checkin' });
    if (note.trim()) addJournal({ prompt, text: note.trim() });
    if (fresh.length) useUI.getState().celebrate(fresh);
    haptic([8, 40, 8]);
    setStep(3);
  };

  return (
    <Sheet open={open} onClose={close} size="md" label="Registro de ánimo">
      <div className="pb-4">
        <AnimatePresence mode="wait" initial={false}>
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-display text-[26px] leading-tight">¿Cómo te sentís ahora?</h2>
              <p className="mt-1 text-[14px] text-2">No hay respuestas correctas. Solo notá lo que hay.</p>
              <div className="mt-7 flex justify-between px-1">
                {MOODS.map((m) => (
                  <button
                    key={m.level}
                    type="button"
                    aria-pressed={level === m.level}
                    className="flex flex-col items-center gap-2"
                    onClick={() => {
                      haptic(8);
                      setLevel(m.level);
                      setTimeout(() => setStep(1), 220);
                    }}
                  >
                    <MoodOrb level={m.level} size={50} selected={level === m.level} />
                    <span className="text-[12px] font-medium text-2">{m.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {step === 1 && level && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center gap-3">
                <MoodOrb level={level} size={34} />
                <h2 className="font-display text-[24px] leading-tight">¿Qué lo describe mejor?</h2>
              </div>
              <p className="mt-1 text-[14px] text-2">Elegí todas las que quieras.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {FEELINGS.map((f) => {
                  const on = feelings.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        haptic(5);
                        setFeelings((xs) => (on ? xs.filter((x) => x !== f.id) : [...xs, f.id]));
                      }}
                      className={cn(
                        'h-10 rounded-full px-4 text-[14px] font-medium transition-all duration-300',
                        on ? 'bg-mist-50 text-ink-900' : 'bg-white/7 text-mist-50/85 hover:bg-white/12',
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-7 flex gap-2.5">
                <Button variant="secondary" onClick={() => setStep(0)}>
                  Atrás
                </Button>
                <Button full onClick={() => setStep(2)}>
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}
          {step === 2 && level && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="font-display text-[24px] leading-tight">¿Querés escribir algo?</h2>
              <p className="mt-1 text-[14px] text-2">{prompt}</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                maxLength={2000}
                aria-label={prompt}
                placeholder="Escribí con libertad. Solo vos podés verlo."
                className="mt-4 w-full resize-none rounded-3xl border border-white/10 bg-white/5 p-4 text-[16px] leading-relaxed outline-none placeholder:text-mist-50/35 focus:border-blush-300/50"
              />
              <div className="mt-5 flex gap-2.5">
                <Button variant="secondary" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <Button full onClick={save}>
                  {note.trim() ? 'Guardar' : 'Guardar sin nota'}
                </Button>
              </div>
            </motion.div>
          )}
          {step === 3 && level && (
            <motion.div key="s3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="mx-auto mt-2 flex justify-center">
                <MoodOrb level={level} size={64} />
              </div>
              <h2 className="mt-5 font-display text-[26px]">Gracias por escucharte</h2>
              <p className="mt-1 text-[14px] text-2">Tu registro quedó guardado en el diario.</p>
              {suggestion && (
                <div className="mt-6 text-left">
                  <p className="mb-2 text-[13px] font-semibold text-3">Te puede ayudar ahora</p>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      usePlayer.getState().playSession(suggestion.id);
                    }}
                    className="glass flex w-full items-center gap-4 rounded-3xl p-3 text-left transition-colors hover:bg-white/10"
                  >
                    <CoverArt spec={suggestion.art} rounded="rounded-2xl" className="size-16 shrink-0" grain={false} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold">{suggestion.title}</span>
                      <span className="block truncate text-[13px] text-3">
                        {formatDuration(suggestion.duration)} · {suggestion.subtitle}
                      </span>
                    </span>
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mist-50 text-ink-900">
                      <Play className="ml-0.5 size-4.5 fill-current" />
                    </span>
                  </button>
                </div>
              )}
              <CheckInEli level={level} feelings={feelings} />
              {level === 1 && (
                <p className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-left text-[13px] leading-relaxed text-2">
                  Si sentís que no podés más o pensás en hacerte daño, pedí ayuda ahora: en Argentina, <strong className="text-mist-50">135</strong> (CABA y GBA) o{' '}
                  <strong className="text-mist-50">(011) 5275-1135</strong>; ante una emergencia, <strong className="text-mist-50">911</strong>.
                </p>
              )}
              <Button full variant="secondary" size="lg" className="mt-4" onClick={close}>
                Cerrar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Sheet>
  );
}

const HARD_FEELINGS = ['ansiedad', 'abrumado', 'tristeza', 'soledad', 'culpa', 'estres'];

/** When the check-in shows a hard moment, Eli offers to talk: a message, not a sales pitch. */
function CheckInEli({ level, feelings }: { level: MoodLevel; feelings: string[] }) {
  const hard = level <= 2 || feelings.some((f) => HARD_FEELINGS.includes(f));
  const eli = useEliInvite('checkin', hard, 3);
  return (
    <AnimatePresence>
      {eli.show && (
        <EliInvite
          placement="checkin"
          eyebrow="Si lo necesitás"
          title="¿Querés hablarlo con alguien?"
          body="Soy Eli. Si estos días se te hacen cuesta arriba, escribime y lo charlamos. Si preferís, también podemos agendar una sesión."
          lead="whatsapp"
          topic="support"
          whatsappLabel="Escribirle a Eli"
          onDismiss={() => eli.dismiss(7)}
          delay={0.5}
          className="mt-4 text-left"
        />
      )}
    </AnimatePresence>
  );
}
