import { AudioLines, BookHeart, House, Moon, NotebookPen, Settings, Sparkles, Timer, UserRound, Wind } from 'lucide-react';
import { motion } from 'motion/react';
import { NavLink, useLocation } from 'react-router';
import { Logo } from '@/components/Logo';
import { EliAvatar } from '@/features/eli/EliAvatar';
import { haptic } from '@/lib/device';
import { useStats } from '@/lib/hooks';
import { SPRING_GLIDE } from '@/lib/motion';
import { cn } from '@/lib/utils';

export const TABS = [
  { to: '/', label: 'Inicio', icon: House },
  { to: '/meditar', label: 'Meditar', icon: Sparkles },
  { to: '/dormir', label: 'Dormir', icon: Moon },
  { to: '/sonidos', label: 'Sonidos', icon: AudioLines },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
] as const;

function isActive(pathname: string, to: string): boolean {
  if (to === '/') return pathname === '/';
  if (to === '/meditar') return ['/meditar', '/programa', '/tema', '/buscar'].some((p) => pathname.startsWith(p));
  if (to === '/perfil') return ['/perfil', '/diario', '/ajustes'].some((p) => pathname.startsWith(p));
  return pathname.startsWith(to);
}

export function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/6 bg-ink-900/80 backdrop-blur-2xl lg:hidden"
      style={{ paddingBottom: 'max(6px, var(--safe-bottom))' }}
    >
      <ul className="mx-auto flex h-[var(--tabbar-h)] max-w-lg items-stretch justify-around px-2">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = isActive(pathname, to);
          return (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                onClick={() => haptic(5)}
                className="relative flex h-full flex-col items-center justify-center gap-1"
                aria-current={active ? 'page' : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="tab-glow"
                    className="absolute top-1.5 h-8 w-14 rounded-full bg-white/10"
                    transition={SPRING_GLIDE}
                  />
                )}
                <Icon className={cn('relative size-[22px] transition-all duration-300', active ? 'text-mist-50' : 'text-mist-50/60')} strokeWidth={active ? 2 : 1.6} />
                <span className={cn('relative text-[11px] font-semibold tracking-wide transition-colors duration-300', active ? 'text-mist-50' : 'text-mist-50/60')}>
                  {label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const TOOLS = [
  { to: '/respirar', label: 'Respirar', icon: Wind },
  { to: '/temporizador', label: 'Temporizador', icon: Timer },
  { to: '/diario', label: 'Diario', icon: NotebookPen },
];

export function SideNav() {
  const { pathname } = useLocation();
  const { streak } = useStats();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-white/6 bg-ink-900/70 px-5 py-7 backdrop-blur-2xl lg:flex">
      <NavLink to="/" className="px-2">
        <Logo />
      </NavLink>
      <nav aria-label="Principal" className="mt-10 flex flex-col gap-1">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = isActive(pathname, to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'relative flex h-11 items-center gap-3.5 rounded-2xl px-3.5 text-[15px] font-semibold transition-colors duration-300',
                active ? 'text-mist-50' : 'text-mist-50/60 hover:bg-white/4 hover:text-mist-50',
              )}
            >
              {active && (
                <motion.span
                  layoutId="side-active"
                  className="absolute inset-0 rounded-2xl bg-white/9"
                  transition={SPRING_GLIDE}
                />
              )}
              <Icon className="relative size-5" strokeWidth={active ? 2 : 1.7} />
              <span className="relative">{label}</span>
            </NavLink>
          );
        })}
      </nav>
      <p className="mt-9 px-3.5 text-[12px] font-bold tracking-[0.14em] text-3 uppercase">Herramientas</p>
      <div className="mt-2 flex flex-col gap-1">
        {TOOLS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive: current }) =>
              cn(
                'flex h-11 items-center gap-3.5 rounded-2xl px-3.5 text-[15px] font-semibold transition-colors hover:bg-white/4 hover:text-mist-50',
                current ? 'bg-white/9 text-mist-50' : 'text-mist-50/60',
              )
            }
          >
            <Icon className="size-5" strokeWidth={1.7} />
            {label}
          </NavLink>
        ))}
      </div>
      <div className="mt-auto">
        <NavLink
          to="/eli"
          className={cn(
            'mb-3 flex items-center gap-3 rounded-3xl border border-white/8 bg-[linear-gradient(135deg,rgb(168_220_213/0.14),rgb(246_222_175/0.05))] p-3.5 transition-colors hover:bg-white/6',
            isActive(pathname, '/eli') && 'border-blush-300/40',
          )}
        >
          <EliAvatar size={40} />
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold">Sesiones con Eli</span>
            <span className="block text-[12px] text-3">Tu espacio 1:1, online</span>
          </span>
        </NavLink>
        <div className="glass rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <BookHeart className="size-5 text-peach-300" />
            <div>
              <p className="text-[14px] font-semibold">{streak > 0 ? `Racha de ${streak} ${streak === 1 ? 'día' : 'días'}` : 'Empezá tu racha'}</p>
              <p className="text-[12px] text-3">{streak > 0 ? 'Seguí así, un día a la vez' : 'Unos minutos hoy son suficientes'}</p>
            </div>
          </div>
        </div>
        <NavLink
          to="/ajustes"
          className="mt-3 flex h-11 items-center gap-3.5 rounded-2xl px-3.5 text-[14px] font-semibold text-mist-50/60 transition-colors hover:text-mist-50"
        >
          <Settings className="size-[18px]" strokeWidth={1.7} />
          Ajustes
        </NavLink>
      </div>
    </aside>
  );
}
