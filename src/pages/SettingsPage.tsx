import { CalendarHeart, CalendarPlus, ChevronRight, Download, HeartHandshake, Smartphone, Trash2, Upload } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Chip, Slider, Switch } from '@/components/ui/controls';
import { ELI } from '@/content/eli';
import { GOALS } from '@/content/goals';
import { SCENES } from '@/content/scenes';
import { EliAvatar } from '@/features/eli/EliAvatar';
import { InstagramIcon, WhatsAppIcon, useEliLinks } from '@/features/eli/actions';
import { downloadFile, reminderICS } from '@/lib/device';
import { useInstall } from '@/lib/install';
import { isIOS, isStandalone } from '@/lib/utils';
import { useAppStore } from '@/store/app';
import { useUI } from '@/store/ui';
import { PageHeader } from './PageHeader';

export function SettingsPage() {
  const profile = useAppStore((s) => s.profile);
  const settings = useAppStore((s) => s.settings);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const exportData = useAppStore((s) => s.exportData);
  const importData = useAppStore((s) => s.importData);
  const resetAll = useAppStore((s) => s.resetAll);
  const toast = useUI((s) => s.toast);
  const deferred = useInstall((s) => s.deferred);
  const install = useInstall((s) => s.install);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const reminder = settings.reminderTime ?? '21:30';
  const eli = useEliLinks('settings');

  return (
    <div className="pb-16">
      <PageHeader title="Ajustes" back />
      <div className="space-y-8 px-5 md:px-0">
        <Group title="Perfil">
          <label className="block">
            <span className="mb-2 block text-[14px] text-2">Tu nombre</span>
            <input
              value={profile.name}
              onChange={(e) => updateProfile({ name: e.target.value.slice(0, 40) })}
              placeholder="¿Cómo te llamás?"
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-[16px] outline-none placeholder:text-mist-50/35 focus:border-blush-300/60"
            />
          </label>
          <div className="mt-5">
            <span className="mb-2 block text-[14px] text-2">Lo que más te cuesta hoy</span>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => {
                const on = profile.goals.includes(g.id);
                return (
                  <Chip
                    key={g.id}
                    active={on}
                    onClick={() => updateProfile({ goals: on ? profile.goals.filter((x) => x !== g.id) : [...profile.goals, g.id] })}
                  >
                    {g.label}
                  </Chip>
                );
              })}
            </div>
          </div>
        </Group>

        <Group title="Recordatorio diario">
          <p className="text-[14px] leading-relaxed text-2">
            Elegí tu momento de calma y agregalo a tu calendario. Vas a recibir un aviso cada día, en cualquier dispositivo.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="time"
              value={reminder}
              onChange={(e) => updateSettings({ reminderTime: e.target.value })}
              className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-[16px] outline-none [color-scheme:dark] focus:border-blush-300/60"
              aria-label="Hora del recordatorio"
            />
            <Button
              variant="secondary"
              icon={<CalendarPlus className="size-4.5" />}
              onClick={() => {
                updateSettings({ reminderTime: reminder });
                downloadFile('mindfulness-recordatorio.ics', reminderICS(reminder, location.origin), 'text/calendar');
                toast('Abrí el archivo para agregarlo a tu calendario');
              }}
            >
              Agregar a mi calendario
            </Button>
          </div>
        </Group>

        <Group title="Reproducción">
          <Row label="Subtítulos en las meditaciones" control={<Switch checked={settings.captions} onChange={(v) => updateSettings({ captions: v })} label="Subtítulos" />} />
          <div className="py-3">
            <p className="mb-1 text-[15px]">Volumen del sonido de fondo</p>
            <Slider value={settings.bedVolume} onChange={(v) => updateSettings({ bedVolume: v })} label="Volumen de fondo" />
          </div>
          <div className="py-3">
            <p className="text-[15px]">Tras una práctica para dormir, el fondo sigue sonando</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[5, 10, 20, 30, 45].map((m) => (
                <Chip key={m} active={settings.sleepFadeMinutes === m} onClick={() => updateSettings({ sleepFadeMinutes: m })}>
                  {m} min
                </Chip>
              ))}
            </div>
          </div>
        </Group>

        <Group title="Experiencia">
          <Row label="Vibración suave" hint="En dispositivos compatibles" control={<Switch checked={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} label="Vibración" />} />
          <Row
            label="Mantener la pantalla encendida"
            hint="Durante la respiración y el temporizador"
            control={<Switch checked={settings.keepAwake} onChange={(v) => updateSettings({ keepAwake: v })} label="Pantalla encendida" />}
          />
          <Row label="Sonido de la escena de inicio" control={<Switch checked={settings.sceneSound} onChange={(v) => updateSettings({ sceneSound: v })} label="Sonido de escena" />} />
          <div className="py-3">
            <p className="mb-3 text-[15px]">Escena de inicio</p>
            <div className="flex flex-wrap gap-2">
              {SCENES.map((s) => (
                <Chip key={s.id} active={settings.sceneId === s.id} onClick={() => updateSettings({ sceneId: s.id })}>
                  {s.name}
                </Chip>
              ))}
            </div>
          </div>
        </Group>

        {!isStandalone && (
          <Group title="Instalá la app">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 size-5 shrink-0 text-2" />
              <div className="text-[14px] leading-relaxed text-2">
                {deferred ? (
                  <>
                    <p>Usala como una app: a pantalla completa, desde tu inicio y también sin conexión.</p>
                    <Button className="mt-3" size="sm" onClick={() => void install()}>
                      Instalar app
                    </Button>
                  </>
                ) : isIOS ? (
                  <p>
                    En Safari, tocá <strong className="text-mist-50">Compartir</strong> y luego <strong className="text-mist-50">Agregar a inicio</strong>. Vas a tener Mindfulness by Eli como una app más.
                  </p>
                ) : (
                  <p>Desde el menú de tu navegador, elegí “Instalar aplicación” o “Agregar a la pantalla de inicio”.</p>
                )}
              </div>
            </div>
          </Group>
        )}

        <Group title="Tus datos">
          <p className="text-[14px] leading-relaxed text-2">
            Todo se guarda de forma privada en este dispositivo. Hacé una copia para llevar tu progreso a otro lugar.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="size-4" />}
              onClick={() => {
                downloadFile(`mindfulness-by-eli-${new Date().toISOString().slice(0, 10)}.json`, exportData(), 'application/json');
                toast('Copia descargada', 'success');
              }}
            >
              Exportar
            </Button>
            <Button variant="secondary" size="sm" icon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>
              Importar
            </Button>
            <Button variant="ghost" size="sm" icon={<Trash2 className="size-4" />} onClick={() => setConfirmReset(true)} className="text-rose-300">
              Borrar todo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const ok = importData(await f.text());
                toast(ok ? 'Datos importados' : 'El archivo no es una copia válida de la app', ok ? 'success' : 'default');
                e.target.value = '';
              }}
            />
          </div>
        </Group>

        <Group title="Eli">
          <Link to="/eli" className="flex items-center gap-3.5 border-b border-white/5 pb-4">
            <EliAvatar size={48} />
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold">{ELI.fullName}</span>
              <span className="block text-[13px] text-3">Mindfulness · Coaching · Yoga</span>
            </span>
            <ChevronRight className="size-4.5 text-3" />
          </Link>
          <LinkRow href={eli.booking} onClick={() => eli.track('book')} icon={<CalendarHeart className="size-4.5" />} label="Agendar una sesión 1:1" />
          <LinkRow href={eli.whatsapp('hello')} onClick={() => eli.track('whatsapp')} icon={<WhatsAppIcon className="size-4.5" />} label="Escribirle por WhatsApp" />
          <LinkRow href={ELI.instagram} onClick={() => eli.track('instagram')} icon={<InstagramIcon className="size-4.5" />} label={`Seguirla en Instagram · ${ELI.handle}`} />
        </Group>

        <Group title="Acerca de">
          <div className="space-y-3 text-[14px] leading-relaxed text-2">
            <p>
              Mindfulness by Eli es un espacio para meditar, respirar y descansar mejor, pensado para mujeres. Las meditaciones guiadas usan una voz neuronal
              en español (Luz), y todos los paisajes sonoros y la música se generan en tiempo real en tu dispositivo.
            </p>
            <p className="flex gap-2.5 rounded-2xl bg-white/4 p-3.5">
              <HeartHandshake className="mt-0.5 size-4.5 shrink-0" />
              <span>
                Esta app acompaña, pero no reemplaza la atención profesional de salud mental. Si estás atravesando una crisis o pensás en hacerte daño, pedí
                ayuda ahora: en Argentina, el Centro de Asistencia al Suicida atiende en el <strong className="text-mist-50">135</strong> (CABA y GBA) y el{' '}
                <strong className="text-mist-50">(011) 5275-1135</strong> (todo el país); ante una emergencia, llamá al <strong className="text-mist-50">911</strong>. En otro país,
                contactá a la línea de ayuda local.
              </span>
            </p>
            <p className="text-[12px] text-3">Versión 1.1 · Voz: Piper (es_MX “claude”, Apache 2.0).</p>
          </div>
        </Group>
      </div>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="¿Borrar todos tus datos?" size="sm">
        <p className="text-[15px] leading-relaxed text-2">Se eliminarán tu progreso, tu diario, tus mezclas y tus ajustes de este dispositivo. No se puede deshacer.</p>
        <div className="mt-6 flex gap-2.5 pb-4">
          <Button variant="secondary" full onClick={() => setConfirmReset(false)}>
            Cancelar
          </Button>
          <Button
            full
            className="bg-rose-300 text-ink-900 hover:bg-rose-300/90"
            onClick={() => {
              resetAll();
              setConfirmReset(false);
              toast('Datos borrados');
              location.assign('/bienvenida');
            }}
          >
            Borrar
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-bold tracking-[0.14em] text-3 uppercase">{title}</h2>
      <div className="glass rounded-[28px] px-5 py-4">{children}</div>
    </section>
  );
}

function LinkRow({ href, onClick, icon, label }: { href: string; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="flex items-center gap-3 border-b border-white/5 py-3.5 text-[15px] transition-colors last:border-0 last:pb-1 hover:text-blush-300"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-white/6 text-blush-300">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="size-4 text-3" />
    </a>
  );
}

function Row({ label, hint, control }: { label: string; hint?: string; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
      <div>
        <p className="text-[15px]">{label}</p>
        {hint && <p className="text-[12.5px] text-3">{hint}</p>}
      </div>
      {control}
    </div>
  );
}
