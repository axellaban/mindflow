import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { type ReactNode, Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useOutlet, useParams } from 'react-router';
import { SideNav, TabBar } from '@/components/layout/Nav';
import { Celebration, Toaster } from '@/components/layout/Overlays';
import { SESSION_BY_ID } from '@/content/catalog';
import { CheckInSheet } from '@/features/checkin/CheckInSheet';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { MiniPlayer } from '@/features/player/MiniPlayer';
import { PlayerScreen } from '@/features/player/PlayerScreen';
import { Home } from '@/pages/Home';
import { Meditate } from '@/pages/Meditate';
import { NotFound } from '@/pages/NotFound';
import { Sleep } from '@/pages/Sleep';
import { Sounds } from '@/pages/Sounds';

// Secondary screens load on demand (the service worker precaches them after the first visit).
const BreatheScreen = lazy(() => import('@/features/breathe/BreatheScreen').then((m) => ({ default: m.BreatheScreen })));
const TimerScreen = lazy(() => import('@/features/timer/TimerScreen').then((m) => ({ default: m.TimerScreen })));
const Profile = lazy(() => import('@/pages/Profile').then((m) => ({ default: m.Profile })));
const ProgramPage = lazy(() => import('@/pages/ProgramPage').then((m) => ({ default: m.ProgramPage })));
const CategoryPage = lazy(() => import('@/pages/CategoryPage').then((m) => ({ default: m.CategoryPage })));
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const JournalPage = lazy(() => import('@/pages/JournalPage').then((m) => ({ default: m.JournalPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const EliPage = lazy(() => import('@/pages/EliPage').then((m) => ({ default: m.EliPage })));
import { useAppStore } from '@/store/app';
import { usePlayer } from '@/store/player';

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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
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

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
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
