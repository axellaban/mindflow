import { Bookmark, Moon, Pause, Play, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { CoverArt } from '@/art/CoverArt';
import { Button, IconButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { SectionTitle, Slider } from '@/components/ui/controls';
import { Rail } from '@/components/cards';
import { SleepTimerSheet } from '@/features/player/sheets';
import { MIX_PRESETS, SOUNDS, SOUND_BY_ID } from '@/content/sounds';
import type { ArtSpec, Mix, SoundId } from '@/content/types';
import { haptic } from '@/lib/device';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';

function artForMix(mix: Mix): ArtSpec {
  const ids = Object.entries(mix)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([id]) => id);
  const top = ids[0];
  const seed = ids.join('').length * 13;
  switch (top) {
    case 'lluvia':
    case 'lluvia-techo':
    case 'tormenta':
      return { palette: 'rain', motif: 'rain', seed };
    case 'oceano':
      return { palette: 'ocean', motif: 'waves', seed };
    case 'lago':
    case 'grillos':
      return { palette: 'dusk', motif: 'lake', seed };
    case 'arroyo':
    case 'bosque':
      return { palette: 'forest', motif: 'forest', seed };
    case 'fuego':
      return { palette: 'ember', motif: 'flame', seed };
    case 'tren':
      return { palette: 'night', motif: 'train', seed };
    case 'viento':
    case 'campanillas':
      return { palette: 'snow', motif: 'mountains', seed };
    case 'ronroneo':
    case 'ventilador':
      return { palette: 'lavender', motif: 'moon', seed };
    default:
      return { palette: 'mist', motif: 'hills', seed };
  }
}

export function mixName(mix: Mix): string {
  const ids = Object.keys(mix) as SoundId[];
  const preset = MIX_PRESETS.find((p) => {
    const k = Object.keys(p.mix);
    return k.length === ids.length && k.every((id) => ids.includes(id as SoundId));
  });
  if (preset) return preset.name;
  const names = ids.map((id, i) => {
    const n = SOUND_BY_ID[id]?.name ?? '';
    return i === 0 ? n : n.charAt(0).toLowerCase() + n.slice(1);
  }).filter(Boolean);
  if (names.length === 0) return 'Tu mezcla';
  if (names.length <= 2) return names.join(' y ');
  return `${names.slice(0, 2).join(', ')} y ${names.length - 2} más`;
}

export function Mixer() {
  const item = usePlayer((s) => s.item);
  const status = usePlayer((s) => s.status);
  const sleepTimerEnd = usePlayer((s) => s.sleepTimerEnd);
  const { playMix, updateMix, toggle, close } = usePlayer.getState();
  const mixes = useAppStore((s) => s.mixes);
  const saveMix = useAppStore((s) => s.saveMix);
  const deleteMix = useAppStore((s) => s.deleteMix);
  const [saving, setSaving] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [name, setName] = useState('');

  const mix: Mix = item?.type === 'mix' ? item.mix : {};
  const active = Object.keys(mix) as SoundId[];
  const playing = item?.type === 'mix' && status === 'playing';

  const apply = (next: Mix) => {
    const keys = Object.keys(next);
    if (!keys.length) {
      if (item?.type === 'mix') close();
      return;
    }
    if (item?.type === 'mix') {
      updateMix(next, { name: mixName(next), art: artForMix(next) });
      if (status !== 'playing') usePlayer.getState().resume();
    } else {
      playMix({ id: 'custom', name: mixName(next), mix: next, art: artForMix(next) });
    }
  };

  const toggleSound = (id: SoundId) => {
    haptic(8);
    const next = { ...mix };
    if (next[id]) delete next[id];
    else next[id] = 0.7;
    apply(next);
  };

  const groups = useMemo(
    () => [
      { title: 'Agua', ids: SOUNDS.filter((s) => s.group === 'agua') },
      { title: 'Naturaleza', ids: SOUNDS.filter((s) => s.group === 'naturaleza') },
      { title: 'Hogar', ids: SOUNDS.filter((s) => s.group === 'hogar') },
      { title: 'Ruido de color', ids: SOUNDS.filter((s) => s.group === 'ruido') },
    ],
    [],
  );

  return (
    <div>
      {/* now playing bar */}
      <div className="px-5 md:px-0">
        <motion.div layout className="glass flex items-center gap-3 rounded-[28px] p-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl">
            {active.length ? (
              <CoverArt spec={artForMix(mix)} rounded="rounded-2xl" className="size-14" grain={false} />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white/6">
                <Icon name="AudioWaveform" className="size-6 text-3" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">{active.length ? mixName(mix) : 'Crea tu paisaje sonoro'}</p>
            <p className="truncate text-[13px] text-3">
              {active.length ? `${active.length} ${active.length === 1 ? 'sonido' : 'sonidos'} · ${playing ? 'sonando' : 'en pausa'}` : 'Toca los sonidos para combinarlos'}
            </p>
          </div>
          {active.length > 0 && (
            <>
              <IconButton label="Temporizador" variant="plain" onClick={() => setTimerOpen(true)} className={cn(Boolean(sleepTimerEnd) && 'text-lilac-300')}>
                <Moon className="size-5" />
              </IconButton>
              <IconButton label="Guardar mezcla" variant="plain" onClick={() => setSaving(true)}>
                <Bookmark className="size-5" />
              </IconButton>
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  haptic(8);
                  toggle();
                }}
                aria-label={playing ? 'Pausar' : 'Reproducir'}
                className="flex size-12 items-center justify-center rounded-full bg-mist-50 text-ink-900"
              >
                {playing ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
              </motion.button>
            </>
          )}
        </motion.div>
      </div>

      {groups.map((g) => (
        <div key={g.title} className="mt-7">
          <p className="mb-3 px-5 text-[13px] font-semibold tracking-wide text-3 uppercase md:px-0">{g.title}</p>
          <div className="grid grid-cols-3 gap-2.5 px-5 sm:grid-cols-4 md:px-0 lg:grid-cols-6">
            {g.ids.map((s) => {
              const on = Boolean(mix[s.id]);
              return (
                <div key={s.id} className={cn('relative rounded-3xl transition-all duration-500', on ? 'bg-white/14' : 'bg-white/5 hover:bg-white/8')}>
                  <button
                    type="button"
                    onClick={() => toggleSound(s.id)}
                    aria-pressed={on}
                    className="flex w-full flex-col items-center gap-2 px-2 pt-4 pb-3 text-center"
                    title={s.hint}
                  >
                    <span
                      className={cn(
                        'relative flex size-12 items-center justify-center rounded-full transition-all duration-500',
                        on ? 'bg-mist-50 text-ink-900' : 'bg-white/6 text-mist-50/75',
                      )}
                    >
                      {on && playing && <span className="absolute inset-0 animate-pulse-soft rounded-full bg-mist-50/40 blur-md" />}
                      <Icon name={s.icon} className="relative size-5.5" />
                    </span>
                    <span className={cn('text-[13px] leading-tight font-medium', on ? 'text-mist-50' : 'text-mist-50/70')}>{s.name}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden px-3"
                      >
                        <Slider
                          label={`Volumen de ${s.name}`}
                          value={mix[s.id] ?? 0.7}
                          min={0.05}
                          max={1}
                          onChange={(v) => updateMix({ ...mix, [s.id]: v })}
                          className="mb-1.5"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="mt-10">
        <SectionTitle title="Mezclas sugeridas" />
        <Rail>
          {MIX_PRESETS.map((p) => (
            <motion.button
              key={p.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                haptic(8);
                playMix({ id: p.id, name: p.name, mix: p.mix, art: p.art });
              }}
              className="group w-[150px] shrink-0 text-left md:w-[176px]"
            >
              <CoverArt spec={p.art} className="aspect-square w-full" />
              <p className="mt-2 line-clamp-2 text-[14px] leading-snug font-semibold">{p.name}</p>
              <p className="text-[12px] text-3">{Object.keys(p.mix).map((id) => SOUND_BY_ID[id as SoundId]?.name).join(' · ')}</p>
            </motion.button>
          ))}
        </Rail>
      </div>

      {mixes.length > 0 && (
        <div className="mt-10 px-5 md:px-0">
          <h2 className="mb-3 font-display text-[22px]">Mis mezclas</h2>
          <div className="space-y-1">
            {mixes.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-white/4">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => {
                    haptic(8);
                    playMix({ id: m.id, name: m.name, mix: m.mix, art: artForMix(m.mix) });
                  }}
                >
                  <CoverArt spec={artForMix(m.mix)} rounded="rounded-xl" className="size-12 shrink-0" grain={false} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{m.name}</span>
                    <span className="block truncate text-[12px] text-3">
                      {Object.keys(m.mix).map((id) => SOUND_BY_ID[id as SoundId]?.name).join(' · ')}
                    </span>
                  </span>
                </button>
                <IconButton
                  label="Eliminar mezcla"
                  variant="plain"
                  size="sm"
                  onClick={() => {
                    deleteMix(m.id);
                    useUI.getState().toast('Mezcla eliminada');
                  }}
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      )}

      <Sheet open={saving} onClose={() => setSaving(false)} title="Guardar mezcla" size="sm">
        <form
          className="pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveMix(name || mixName(mix), mix);
            useUI.getState().toast('Mezcla guardada', 'success');
            setName('');
            setSaving(false);
          }}
        >
          <label className="mb-2 block text-[14px] text-2" htmlFor="mix-name">
            Ponle un nombre
          </label>
          <div className="relative">
            <input
              id="mix-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mixName(mix)}
              maxLength={40}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/6 px-4 text-[16px] outline-none placeholder:text-mist-50/35 focus:border-lilac-300/60"
            />
            {name && (
              <button type="button" onClick={() => setName('')} className="absolute top-1/2 right-3 -translate-y-1/2 text-3" aria-label="Borrar">
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button type="submit" full size="lg" className="mt-4">
            Guardar
          </Button>
        </form>
      </Sheet>
      <SleepTimerSheet open={timerOpen} onClose={() => setTimerOpen(false)} />
    </div>
  );
}
