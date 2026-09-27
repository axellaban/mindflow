import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { type ReactNode, Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useOutlet, useParams } from 'react-router';
import { SideNav, TabBar } from '@/components/layout/Nav';
import { Celebration, Toaster } from '@/components/layout/Overlays';
import { CATEGORY_BY_ID, PROGRAM_BY_ID, SESSION_BY_ID } from '@/content/catalog';
import { isNightHour } from '@/content/scenes';
import { CheckInSheet } from '@/features/checkin/CheckInSheet';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { MiniPlayer } from '@/features/player/MiniPlayer';
import { PlayerScreen } from '@/features/player/PlayerScreen';
import { Home } from '@/pages/Home';
import { Meditate } from '@/pages/Meditate';
import { NotFound } from '@/pages/NotFound';
import { Sleep } from '@/pages/Sleep';
import { useNow } from '@/lib/hooks';
import { hideSplash } from '@/lib/recover';
import { EASE } from '@/lib/motion';
import { Sounds } from '@/pages/Sounds';
import { useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';

// Secondary screens load on demand, then all of them warm up once the app is idle, so moving
// around is instant and a new version going live can never leave a screen missing.
const screens = {
  breathe: () => import('@/features/breathe/BreatheScreen'),
  timer: () => import('@/features/timer/TimerScreen'),
  profile: () => import('@/pages/Profile'),
  program: () => import('@/pages/ProgramPage'),
  category: () => import('@/pages/CategoryPage'),
  search: () => import('@/pages/SearchPage'),
  journal: () => import('@/pages/JournalPage'),
  settings: () => import('@/pages/SettingsPage'),
  eli: () => import('@/pages/EliPage'),
};
const BreatheScreen = lazy(() => screens.breathe().then((m) => ({ default: m.BreatheScreen })));
const TimerScreen = lazy(() => screens.timer().then((m) => ({ default: m.TimerScreen })));
const Profile = lazy(() => screens.profile().then((m) => ({ default: m.Profile })));
const ProgramPage = lazy(() => screens.program().then((m) => ({ default: m.ProgramPage })));
const CategoryPage = lazy(() => screens.category().then((m) => ({ default: m.CategoryPage })));
const SearchPage = lazy(() => screens.search().then((m) => ({ default: m.SearchPage })));
const JournalPage = lazy(() => screens.journal().then((m) => ({ default: m.JournalPage })));
const SettingsPage = lazy(() => screens.settings().then((m) => ({ default: m.SettingsPage })));
const EliPage = lazy(() => screens.eli().then((m) => ({ default: m.EliPage })));

function useWarmScreens() {
  useEffect(() => {
    // well after the first screen and its images have loaded, and never on data saver
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
    const warm = () => Object.values(screens).forEach((load) => void load().catch(() => undefined));
    let idle = 0;
    const t = setTimeout(() => {
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(warm, { timeout: 4000 });
      else warm();
    }, 8000);
    return () => {
      clearTimeout(t);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, []);
}

function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return <>{frozen}</>;
}

function Shell() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="relative min-h-dvh">
      <SideNav />
      <main className="relative lg:pl-[260px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } }}
            className="min-h-dvh pb-[calc(var(--tabbar-h)+96px)] lg:pb-28"
          >
            <FrozenOutlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <TabBar />
    </div>
  );
}

/** Standard centered column; full-bleed pages (home, sleep) manage their own width. */
function Contained({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl md:px-8 lg:px-10">{children}</div>;
}

function RequireOnboarding({ children }: { children: ReactNode }) {
  const onboarded = useAppStore((s) => s.profile.onboarded);
  if (!onboarded) return <Navigate to="/bienvenida" replace />;
  return <>{children}</>;
}

function SessionLink() {
  const { id } = useParams();
  const navigate = useNavigate();
  const onboarded = useAppStore((s) => s.profile.onboarded);
  useEffect(() => {
    if (id && SESSION_BY_ID[id]) usePlayer.getState().openSession(id);
    navigate(onboarded ? '/' : '/meditar', { replace: true });
  }, [id, navigate, onboarded]);
  return null;
}

const TITLES: Record<string, string> = {
  '/bienvenida': 'Bienvenida',
  '/respirar': 'Respirar',
  '/temporizador': 'Temporizador',
  '/eli': 'Sesiones 1:1 con Eli',
  '/meditar': 'Meditar',
  '/dormir': 'Dormir',
  '/sonidos': 'Sonidos',
  '/perfil': 'Tu perfil',
  '/buscar': 'Buscar',
  '/diario': 'Diario',
  '/ajustes': 'Ajustes',
};

/** Each screen names itself in the browser tab, history and to screen readers. */
function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const [, section, id] = pathname.split('/');
    const name =
      pathname === '/'
        ? null
        : section === 'programa'
          ? PROGRAM_BY_ID[id as keyof typeof PROGRAM_BY_ID]?.title
          : section === 'tema'
            ? CATEGORY_BY_ID[id as keyof typeof CATEGORY_BY_ID]?.name
            : TITLES[pathname];
    document.title = name ? `${name} · CalmabyEli` : 'CalmabyEli — Meditación para mujeres';
  }, [pathname]);
  return null;
}

/**
 * Dormir and the sleep stories wear the night palette, and so does the whole app from 20 h to 5 h
 * while the beach follows the hour (a scene chosen by hand keeps the sea colours).
 */
function ThemeSync() {
  const { pathname } = useLocation();
  const sleepStory = usePlayer((s) => s.expanded && s.item?.type === 'session' && Boolean(SESSION_BY_ID[s.item.id]?.sleep));
  const followsHour = useAppStore((s) => s.settings.sceneId === 'auto');
  const now = useNow(60_000);
  const night = pathname.startsWith('/dormir') || sleepStory || (followsHour && isNightHour(now));
  useEffect(() => {
    const root = document.documentElement;
    if (night) root.dataset.theme = 'noche';
    else delete root.dataset.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', night ? '#0e1a3a' : '#09596c');
  }, [night]);
  return null;
}

/** The HTML's loading screen fades away once the app has drawn its first frame. */
function useHideSplash() {
  useEffect(hideSplash, []);
}

export default function App() {
  useWarmScreens();
  useHideSplash();
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <RouteTitle />
        <ThemeSync />
        <Suspense fallback={<div className="min-h-dvh bg-ink-900" />}>
        <Routes>
          <Route path="/bienvenida" element={<Onboarding />} />
          <Route path="/respirar" element={<BreatheScreen />} />
          <Route path="/temporizador" element={<TimerScreen />} />
          <Route path="/sesion/:id" element={<SessionLink />} />
          {/* Eli's page is public so it can be shared from her Instagram. */}
          <Route element={<Shell />}>
            <Route path="/eli" element={<Contained><EliPage /></Contained>} />
          </Route>
          <Route
            element={
              <RequireOnboarding>
                <Shell />
              </RequireOnboarding>
            }
          >
            <Route index element={<Home />} />
            <Route path="/meditar" element={<Contained><Meditate /></Contained>} />
            <Route path="/dormir" element={<Sleep />} />
            <Route path="/sonidos" element={<Contained><Sounds /></Contained>} />
            <Route path="/perfil" element={<Contained><Profile /></Contained>} />
            <Route path="/programa/:id" element={<Contained><ProgramPage /></Contained>} />
            <Route path="/tema/:id" element={<Contained><CategoryPage /></Contained>} />
            <Route path="/buscar" element={<Contained><SearchPage /></Contained>} />
            <Route path="/diario" element={<Contained><JournalPage /></Contained>} />
            <Route path="/ajustes" element={<Contained><SettingsPage /></Contained>} />
            <Route path="*" element={<Contained><NotFound /></Contained>} />
          </Route>
        </Routes>
        </Suspense>
        <MiniPlayer />
        <PlayerScreen />
        <CheckInSheet />
        <Celebration />
        <Toaster />
      </BrowserRouter>
    </MotionConfig>
  );
}
