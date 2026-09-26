import { type RefObject, memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { SceneDef } from '@/content/scenes';
import type { ArtSpec, Motif } from '@/content/types';
import { cn, prefersReducedMotion } from '@/lib/utils';
import { Landscape, horizonFor } from './landscape';
import { PALETTES, rgba } from './palettes';

const MOTIF_FOR: Record<SceneDef['layout'], Motif> = {
  lake: 'lake',
  forest: 'forest',
  ocean: 'waves',
  aurora: 'mountains',
  campfire: 'flame',
  snow: 'cabin',
  desert: 'dunes',
  valley: 'path',
};

const HORIZON: Record<SceneDef['layout'], number> = {
  lake: 0.56,
  forest: 0.64,
  ocean: 0.58,
  aurora: 0.64,
  campfire: 0.64,
  snow: 0.64,
  desert: 0.64,
  valley: 0.64,
};

interface Props {
  scene: SceneDef;
  className?: string;
  /** Pause the animation (e.g. when covered by another screen). */
  paused?: boolean;
  /** Slow Ken Burns drift of the backdrop. */
  drift?: boolean;
}

export const Scene = memo(function Scene({ scene, className, paused, drift = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0.62);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth < 2 || el.clientHeight < 2) return;
      const r = el.clientWidth / el.clientHeight;
      setRatio((prev) => (Math.abs(prev - r) > 0.04 ? Math.round(r * 100) / 100 : prev));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const spec: ArtSpec = useMemo(
    () => ({ palette: scene.palette, motif: scene.motif ?? MOTIF_FOR[scene.layout], seed: scene.seed }),
    [scene],
  );
  const p = PALETTES[scene.palette];
  const horizon = scene.motif ? horizonFor(scene.motif) : HORIZON[scene.layout];
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const auroraRef = useRef<HTMLCanvasElement>(null);
  useParticles(scene, horizon, paused, backRef, frontRef, auroraRef);

  return (
    <div
      ref={ref}
      className={cn('absolute inset-0 overflow-hidden', className)}
      style={{
        background: `linear-gradient(180deg, ${p.sky[0]} 0%, ${p.sky[1]} ${Math.round(horizon * 62)}%, ${p.sky[2]} ${Math.round(horizon * 100)}%, ${p.sky[2]} 100%)`,
      }}
    >
      <div className={cn('absolute inset-0 will-change-transform', drift && 'animate-drift')} style={{ animationDuration: '46s' }}>
        {scene.layout === 'aurora' && (
          <canvas ref={auroraRef} className="pointer-events-none absolute inset-0 h-full w-full" style={{ filter: 'blur(24px)' }} />
        )}
        <canvas ref={backRef} className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="absolute inset-0">
          <Landscape spec={spec} ratio={ratio} uid={uid} noStars skyless detail="scene" />
        </div>
        {scene.layout === 'campfire' && (
          <div
            className="pointer-events-none absolute left-1/2 top-[80%] h-[70%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: `radial-gradient(closest-side, ${rgba(p.glow, 0.42)}, ${rgba(p.glow, 0)})`,
              animation: 'pulse-soft 2.4s ease-in-out infinite',
              mixBlendMode: 'screen',
            }}
          />
        )}
        {(scene.layout === 'forest' || scene.layout === 'valley' || scene.layout === 'lake' || scene.layout === 'snow') && (
          <Mist color={scene.layout === 'lake' ? p.sky[2] : p.layers[0]} opacity={scene.layout === 'valley' ? 0.4 : 0.26} />
        )}
      </div>
      <canvas ref={frontRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
});

function Mist({ color, opacity }: { color: string; opacity: number }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[48%] h-[30%]" style={{ opacity }}>
      <div
        className="absolute -left-1/4 top-0 h-full w-[90%] rounded-full blur-3xl"
        style={{ background: color, animation: 'drift 38s ease-in-out infinite alternate' }}
      />
      <div
        className="absolute -right-1/4 top-[25%] h-[80%] w-[80%] rounded-full blur-3xl"
        style={{ background: color, animation: 'drift 52s ease-in-out infinite alternate-reverse' }}
      />
    </div>
  );
}

// ───────────────────────────────────────────────────────────── particles

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  s: number;
  ph: number;
}

interface Mover {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  life: number;
  max: number;
  ph: number;
}

function glowSprite(color: string, size = 64): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, rgba(color, 1));
  grad.addColorStop(0.25, rgba(color, 0.55));
  grad.addColorStop(1, rgba(color, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

function useParticles(
  scene: SceneDef,
  horizon: number,
  paused: boolean | undefined,
  backRef: RefObject<HTMLCanvasElement | null>,
  frontRef: RefObject<HTMLCanvasElement | null>,
  auroraRef: RefObject<HTMLCanvasElement | null>,
): void {
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    if (!back || !front) return;
    const bctx = back.getContext('2d');
    const fctx = front.getContext('2d');
    if (!bctx || !fctx) return;
    const auroraCanvas = auroraRef.current;
    const actx = auroraCanvas?.getContext('2d') ?? null;
    const p = PALETTES[scene.palette];
    const kinds = new Set(scene.particles);
    const reduced = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let rain: Mover[] = [];
    let snow: Mover[] = [];
    let embers: Mover[] = [];
    let flies: Mover[] = [];
    let shimmer: Star[] = [];
    let shooting: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
    let nextShoot = 5 + Math.random() * 8;
    const emberSprite = glowSprite(p.accent[1]);
    const flySprite = glowSprite('#fff1a8');

    const size = (c: HTMLCanvasElement, g: CanvasRenderingContext2D, scale: number) => {
      c.width = Math.max(1, Math.round(w * scale));
      c.height = Math.max(1, Math.round(h * scale));
      g.setTransform(scale, 0, 0, scale, 0, 0);
    };

    const build = () => {
      w = front.clientWidth;
      h = front.clientHeight;
      size(back, bctx, dpr);
      size(front, fctx, dpr);
      if (auroraCanvas && actx) size(auroraCanvas, actx, 0.5);
      const area = (w * h) / 10000;
      stars = kinds.has('stars')
        ? Array.from({ length: Math.min(280, Math.round(area * 2.8)) }, () => ({
            x: Math.random() * w,
            y: Math.pow(Math.random(), 1.3) * h * horizon,
            r: 0.35 + Math.pow(Math.random(), 4) * 1.5,
            a: 0.25 + Math.random() * 0.75,
            s: 0.4 + Math.random() * 1.8,
            ph: Math.random() * 6.28,
          }))
        : [];
      rain = kinds.has('rain')
        ? Array.from({ length: Math.min(320, Math.round(area * 3.2)) }, () => ({
            x: Math.random() * (w + 60),
            y: Math.random() * h,
            vx: -60,
            vy: 700 + Math.random() * 500,
            r: 10 + Math.random() * 16,
            a: 0.1 + Math.random() * 0.26,
            life: 0,
            max: 0,
            ph: 0,
          }))
        : [];
      snow = kinds.has('snow')
        ? Array.from({ length: Math.min(220, Math.round(area * 2.2)) }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: 0,
            vy: 14 + Math.random() * 38,
            r: 0.8 + Math.pow(Math.random(), 2) * 2.6,
            a: 0.45 + Math.random() * 0.5,
            life: 0,
            max: 0,
            ph: Math.random() * 6.28,
          }))
        : [];
      embers = [];
      flies = kinds.has('fireflies')
        ? Array.from({ length: Math.round(7 + area * 0.1) }, () => ({
            x: Math.random() * w,
            y: h * (horizon + 0.04 + Math.random() * 0.3),
            vx: 0,
            vy: 0,
            r: 0,
            a: 0,
            life: Math.random() * 10,
            max: 3 + Math.random() * 5,
            ph: Math.random() * 6.28,
          }))
        : [];
      shimmer =
        scene.layout === 'lake' || scene.layout === 'ocean'
          ? Array.from({ length: 36 }, () => ({
              x: w * (0.3 + Math.random() * 0.4),
              y: h * (horizon + 0.02 + Math.pow(Math.random(), 1.3) * (0.95 - horizon)),
              r: 6 + Math.random() * 26,
              a: 0.06 + Math.random() * 0.22,
              s: 0.6 + Math.random() * 1.6,
              ph: Math.random() * 6.28,
            }))
          : [];
    };

    let last = performance.now();
    let acc = 0;
    let t = 0;
    let raf = 0;
    let visible = true;

    const drawBack = (dt: number) => {
      bctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = reduced ? 1 : 0.55 + 0.45 * Math.sin(t * s.s + s.ph);
        bctx.globalAlpha = s.a * tw;
        bctx.fillStyle = '#ffffff';
        bctx.beginPath();
        bctx.arc(s.x, s.y, s.r, 0, 6.283);
        bctx.fill();
      }
      bctx.globalAlpha = 1;
      if (kinds.has('stars') && !reduced) {
        nextShoot -= dt;
        if (nextShoot <= 0 && !shooting) {
          shooting = {
            x: w * (0.25 + Math.random() * 0.7),
            y: h * Math.random() * 0.25,
            vx: -(240 + Math.random() * 200),
            vy: 100 + Math.random() * 80,
            life: 0,
          };
          nextShoot = 11 + Math.random() * 16;
        }
        if (shooting) {
          shooting.life += dt;
          shooting.x += shooting.vx * dt;
          shooting.y += shooting.vy * dt;
          const a = Math.max(0, 1 - shooting.life / 1.1);
          const tx = shooting.x - shooting.vx * 0.28;
          const ty = shooting.y - shooting.vy * 0.28;
          const g = bctx.createLinearGradient(shooting.x, shooting.y, tx, ty);
          g.addColorStop(0, `rgba(255,255,255,${0.9 * a})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          bctx.strokeStyle = g;
          bctx.lineWidth = 1.3;
          bctx.beginPath();
          bctx.moveTo(shooting.x, shooting.y);
          bctx.lineTo(tx, ty);
          bctx.stroke();
          if (shooting.life > 1.1) shooting = null;
        }
      }
      if (actx && scene.layout === 'aurora') {
        actx.clearRect(0, 0, w, h);
        actx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          const base = h * (0.15 + i * 0.085);
          actx.strokeStyle = rgba(p.accent[i]!, 0.34 - i * 0.07);
          actx.lineWidth = h * (0.12 - i * 0.025);
          actx.beginPath();
          for (let x = -40; x <= w + 40; x += 16) {
            const y = base + Math.sin(x * 0.0042 + t * 0.12 + i * 1.7) * h * 0.05 + Math.sin(x * 0.011 - t * 0.09 + i) * h * 0.02;
            if (x === -40) actx.moveTo(x, y);
            else actx.lineTo(x, y);
          }
          actx.stroke();
        }
        actx.globalCompositeOperation = 'source-over';
      }
    };

    const drawFront = (dt: number) => {
      fctx.clearRect(0, 0, w, h);
      for (const s of shimmer) {
        const tw = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(t * s.s + s.ph);
        fctx.globalAlpha = s.a * tw;
        fctx.fillStyle = p.celestial;
        fctx.fillRect(s.x - s.r / 2 + Math.sin(t * 0.4 + s.ph) * 4, s.y, s.r, 1.1);
      }
      fctx.globalAlpha = 1;
      if (rain.length) {
        fctx.strokeStyle = p.celestial;
        fctx.lineWidth = 1;
        for (const d of rain) {
          if (!reduced) {
            d.y += d.vy * dt;
            d.x += d.vx * dt;
            if (d.y > h) {
              d.y = -d.r;
              d.x = Math.random() * (w + 60);
            }
          }
          fctx.globalAlpha = d.a;
          fctx.beginPath();
          fctx.moveTo(d.x, d.y);
          fctx.lineTo(d.x + d.vx * 0.018, d.y + d.r);
          fctx.stroke();
        }
        fctx.globalAlpha = 1;
      }
      for (const f of snow) {
        if (!reduced) {
          f.y += f.vy * dt;
          f.x += Math.sin(t * 0.8 + f.ph) * 12 * dt;
          if (f.y > h + 4) {
            f.y = -4;
            f.x = Math.random() * w;
          }
        }
        fctx.globalAlpha = f.a;
        fctx.fillStyle = '#ffffff';
        fctx.beginPath();
        fctx.arc(f.x, f.y, f.r, 0, 6.283);
        fctx.fill();
      }
      fctx.globalAlpha = 1;
      if (kinds.has('embers') && !reduced) {
        if (Math.random() < dt * 9) {
          embers.push({
            x: w * 0.5 + (Math.random() - 0.5) * w * 0.08,
            y: h * 0.77,
            vx: (Math.random() - 0.5) * 18,
            vy: -(40 + Math.random() * 70),
            r: 0.8 + Math.random() * 1.6,
            a: 1,
            life: 0,
            max: 1.8 + Math.random() * 3,
            ph: Math.random() * 6.28,
          });
        }
        fctx.globalCompositeOperation = 'lighter';
        embers = embers.filter((e) => {
          e.life += dt;
          e.x += (e.vx + Math.sin(t * 2 + e.ph) * 14) * dt;
          e.y += e.vy * dt;
          const k = 1 - e.life / e.max;
          if (k <= 0) return false;
          const flick = 0.6 + 0.4 * Math.sin(t * 12 + e.ph);
          fctx.globalAlpha = k * flick * 0.9;
          const s = e.r * 7;
          fctx.drawImage(emberSprite, e.x - s / 2, e.y - s / 2, s, s);
          return true;
        });
        fctx.globalCompositeOperation = 'source-over';
        fctx.globalAlpha = 1;
      }
      if (flies.length) {
        fctx.globalCompositeOperation = 'lighter';
        for (const f of flies) {
          if (!reduced) {
            f.life += dt;
            f.x += Math.sin(t * 0.3 + f.ph) * 10 * dt;
            f.y += Math.cos(t * 0.23 + f.ph * 1.7) * 6 * dt;
          }
          const blink = Math.max(0, Math.sin((f.life / f.max) * Math.PI * 2));
          fctx.globalAlpha = reduced ? 0.4 : Math.pow(blink, 2) * 0.9;
          fctx.drawImage(flySprite, f.x - 9, f.y - 9, 18, 18);
        }
        fctx.globalCompositeOperation = 'source-over';
        fctx.globalAlpha = 1;
      }
    };

    const draw = (dt: number) => {
      t += dt;
      drawBack(dt);
      drawFront(dt);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (pausedRef.current || !visible || document.hidden) return;
      acc += dt;
      if (acc < 1 / 32) return;
      draw(acc);
      acc = 0;
    };

    build();
    draw(0.016);
    const ro = new ResizeObserver(() => {
      build();
      draw(0);
    });
    ro.observe(front);
    const io = new IntersectionObserver(([e]) => {
      visible = Boolean(e?.isIntersecting);
    });
    io.observe(front);
    if (!reduced) raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [scene, horizon, backRef, frontRef, auroraRef]);
}
