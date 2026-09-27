import {
  Bell,
  Captions,
  Check,
  CloudRain,
  Download,
  Flame,
  Heart,
  Moon,
  Music,
  Piano,
  Share2,
  Trees,
  VolumeX,
  Waves,
  Wind,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Slider, Switch } from '@/components/ui/controls';
import { audioUrl, captionsUrl } from '@/content/catalog';
import { BED_BY_ID, PICKER_BEDS } from '@/content/sounds';
import type { BedId } from '@/content/types';
import { haptic, shareOrCopy } from '@/lib/device';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';
import { useUI } from '@/store/ui';
import type { ItemInfo } from './itemInfo';

const BED_ICONS: Partial<Record<BedId, ReactNode>> = {
  none: <VolumeX className="size-5" />,
  pad: <Music className="size-5" />,
  piano: <Piano className="size-5" />,
  cuencos: <Bell className="size-5" />,
  lluvia: <CloudRain className="size-5" />,
  oceano: <Waves className="size-5" />,
  bosque: <Trees className="size-5" />,
  fuego: <Flame className="size-5" />,
  noche: <Moon className="size-5" />,
  viento: <Wind className="size-5" />,
};

export function BedSheet({ open, onClose, defaultBed }: { open: boolean; onClose: () => void; defaultBed?: BedId }) {
  const bed = usePlayer((s) => s.bed);
  const volume = usePlayer((s) => s.volume);
  const setBed = usePlayer((s) => s.setBed);
  const setVolume = usePlayer((s) => s.setVolume);
  const options = [...new Set<BedId>([...(defaultBed && !PICKER_BEDS.includes(defaultBed) ? [defaultBed] : []), ...PICKER_BEDS])];
  return (
    <Sheet open={open} onClose={onClose} title="Sonido de fondo">
      <div className="mb-5 flex items-center gap-3 pt-1">
        <VolumeX className="size-4 text-3" />
        <Slider value={volume} onChange={setVolume} label="Volumen del fondo" />
        <Waves className="size-4 text-3" />
      </div>
      <div className="grid grid-cols-3 gap-2.5 pb-4 sm:grid-cols-4">
        {options.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={bed === id}
            onClick={() => {
              haptic(6);
              setBed(id);
            }}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl px-2 py-3.5 text-center text-[13px] font-medium transition-all duration-300',
              bed === id ? 'bg-mist-50 text-ink-900' : 'bg-white/6 text-mist-50/85 hover:bg-white/10',
            )}
          >
            {BED_ICONS[id] ?? <Moon className="size-5" />}
            <span className="leading-tight">{BED_BY_ID[id]?.name}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

const TIMER_OPTIONS = [0, 10, 15, 30, 45, 60, 90];

export function SleepTimerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const end = usePlayer((s) => s.sleepTimerEnd);
  const setSleepTimer = usePlayer((s) => s.setSleepTimer);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!open || !end) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open, end]);
  const remaining = end ? Math.max(0, Math.ceil((end - now) / 60000)) : 0;
  return (
    <Sheet open={open} onClose={onClose} title="Temporizador de sueño">
      <p className="mb-4 text-[14px] text-2">
        {end ? `El sonido se apagará suavemente en ${remaining} min.` : 'El sonido se desvanecerá lentamente al terminar el tiempo.'}
      </p>
      <div className="grid grid-cols-4 gap-2.5 pb-4">
        {TIMER_OPTIONS.map((m) => {
          const active = m === 0 ? !end : false;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                haptic(6);
                setSleepTimer(m || null);
                useUI.getState().toast(m ? `Se apagará en ${m} min` : 'Temporizador desactivado');
                onClose();
              }}
              className={cn(
                'h-14 rounded-2xl text-[15px] font-semibold transition-colors',
                active ? 'bg-mist-50 text-ink-900' : 'bg-white/6 hover:bg-white/10',
              )}
            >
              {m ? `${m} min` : 'Apagado'}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

export function OptionsSheet({
  open,
  onClose,
  info,
  onTimer,
}: {
  open: boolean;
  onClose: () => void;
  info: ItemInfo;
  onTimer: () => void;
}) {
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const captions = useAppStore((s) => s.settings.captions);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const isFav = favorites.includes(info.key);
  const [offline, setOffline] = useState<'unknown' | 'no' | 'saving' | 'yes'>('unknown');
  const sessionId = info.session?.id;

  useEffect(() => {
    if (!open || !sessionId || !('caches' in window)) return;
    void caches.match(audioUrl(sessionId)).then((r) => setOffline(r ? 'yes' : 'no'));
  }, [open, sessionId]);

  const saveOffline = async () => {
    if (!sessionId || !('caches' in window)) return;
    setOffline('saving');
    try {
      const url = audioUrl(sessionId);
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const cache = await caches.open('mf-audio');
      await cache.put(url, res);
      // subtitles too, so they also work offline (best effort)
      void fetch(captionsUrl(sessionId))
        .then(async (r) => (r.ok ? (await caches.open('mf-captions')).put(captionsUrl(sessionId), r) : undefined))
        .catch(() => undefined);
      setOffline('yes');
      useUI.getState().toast('Disponible sin conexión', 'success');
    } catch {
      setOffline('no');
      useUI.getState().toast('No se pudo descargar. Intentalo de nuevo.');
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={info.title}>
      {info.description && <p className="mb-4 text-[15px] leading-relaxed text-2">{info.description}</p>}
      <div className="divide-y divide-white/6 pb-4">
        <Row
          icon={<Heart className={cn('size-5', isFav && 'fill-rose-300 text-rose-300')} />}
          label={isFav ? 'En tus favoritos' : 'Agregar a favoritos'}
          onClick={() => {
            const on = toggleFavorite(info.key);
            useUI.getState().toast(on ? 'Guardado en favoritos' : 'Quitado de favoritos');
          }}
        />
        <Row
          icon={<Share2 className="size-5" />}
          label="Compartir"
          onClick={async () => {
            const url = sessionId ? `${location.origin}/sesion/${sessionId}` : location.origin;
            const r = await shareOrCopy({ title: info.title, text: `${info.title} — una pausa para vos en CalmabyEli`, url });
            if (r === 'copied') useUI.getState().toast('Enlace copiado');
          }}
        />
        {info.session && (
          <Row
            icon={<Captions className="size-5" />}
            label="Subtítulos"
            right={<Switch checked={captions} onChange={(v) => updateSettings({ captions: v })} label="Subtítulos" />}
          />
        )}
        <Row
          icon={<Moon className="size-5" />}
          label="Temporizador de sueño"
          onClick={() => {
            onClose();
            setTimeout(onTimer, 250);
          }}
        />
        {info.session && 'caches' in window && (
          <Row
            icon={offline === 'yes' ? <Check className="size-5 text-sage-300" /> : <Download className="size-5" />}
            label={offline === 'yes' ? 'Disponible sin conexión' : offline === 'saving' ? 'Descargando…' : 'Descargar para escuchar sin conexión'}
            onClick={offline === 'no' ? () => void saveOffline() : undefined}
          />
        )}
      </div>
    </Sheet>
  );
}

function Row({ icon, label, onClick, right }: { icon: ReactNode; label: string; onClick?: () => void; right?: ReactNode }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={() => {
        if (!onClick) return;
        haptic(5);
        onClick();
      }}
      className={cn('flex w-full items-center gap-4 py-3.5 text-left', onClick && 'transition-opacity hover:opacity-80')}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-white/8">{icon}</span>
      <span className="flex-1 text-[15px] font-medium">{label}</span>
      {right}
    </Comp>
  );
}
