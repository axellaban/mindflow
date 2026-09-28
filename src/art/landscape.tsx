import type { CSSProperties, ReactNode } from 'react';
import type { ArtSpec, Motif } from '@/content/types';
import { mulberry32 } from '@/lib/utils';
import { PALETTES, type Palette, mixHex } from './palettes';

/**
 * Procedural landscape illustrations. Every cover, hero and scene backdrop in
 * the app is drawn from an ArtSpec (palette + motif + seed), so the whole
 * catalogue shares one visual language without shipping a single image.
 */

export const W = 400;

type Rnd = () => number;

function valueNoise(rnd: Rnd, points: number): (x: number) => number {
  const v = Array.from({ length: points + 2 }, () => rnd());
  return (x: number) => {
    const xi = Math.floor(x);
    const t = x - xi;
    const s = t * t * (3 - 2 * t);
    const a = v[((xi % points) + points) % points]!;
    const b = v[(((xi + 1) % points) + points) % points]!;
    return a + (b - a) * s;
  };
}

interface RidgeOpts {
  y: number;
  amp: number;
  freq: number;
  sharp?: number;
  step?: number;
}

function ridgePoints(rnd: Rnd, width: number, o: RidgeOpts): Array<[number, number]> {
  const n1 = valueNoise(rnd, 64);
  const n2 = valueNoise(rnd, 64);
  const n3 = valueNoise(rnd, 64);
  const off = rnd() * 40;
  const step = o.step ?? 8;
  const pts: Array<[number, number]> = [];
  for (let x = -20; x <= width + 20; x += step) {
    const u = (x / width) * o.freq + off;
    let h = n1(u) * 0.62 + n2(u * 2.3) * 0.26 + n3(u * 5.1) * 0.12;
    if (o.sharp) {
      const ridged = 1 - Math.abs(2 * n1(u * 0.9 + 3.3) - 1);
      h = h * (1 - o.sharp) + ridged * o.sharp;
    }
    pts.push([x, o.y - h * o.amp]);
  }
  return pts;
}

function smoothPath(pts: Array<[number, number]>, bottom: number): string {
  if (!pts.length) return '';
  let d = `M ${pts[0]![0]} ${bottom} L ${pts[0]![0]} ${pts[0]![1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i]!;
    const [nx, ny] = pts[i + 1]!;
    d += ` Q ${x.toFixed(1)} ${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)} ${((y + ny) / 2).toFixed(1)}`;
  }
  const last = pts[pts.length - 1]!;
  d += ` L ${last[0]} ${last[1]} L ${last[0]} ${bottom} Z`;
  return d;
}

function starsGroup(rnd: Rnd, h: number, count: number, maxY: number, key: string): ReactNode {
  const stars: ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const x = rnd() * W;
    const y = Math.pow(rnd(), 1.4) * maxY * h;
    const r = 0.35 + Math.pow(rnd(), 3) * 1.25;
    const o = 0.35 + rnd() * 0.65;
    stars.push(<circle key={`${key}${i}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={r.toFixed(2)} fill="#fff" opacity={o.toFixed(2)} />);
  }
  return <g>{[0, 1, 2].map((phase) => (
    <g key={phase} data-art-motion="twinkle" style={{ animationDelay: `${-phase * 2.3}s` }}>
      {stars.filter((_, i) => i % 3 === phase)}
    </g>
  ))}</g>;
}

function pine(x: number, base: number, height: number, color: string, key: string): ReactNode {
  const w = height * 0.36;
  const tiers = 4;
  let d = '';
  for (let i = 0; i < tiers; i++) {
    const tTop = base - height + (i * height) / (tiers + 0.6);
    const tBot = base - height + ((i + 1.6) * height) / (tiers + 0.6);
    const tw = (w * (i + 1.4)) / (tiers + 0.4);
    d += `M ${x} ${tTop} L ${x - tw / 2} ${tBot} L ${x + tw / 2} ${tBot} Z `;
  }
  d += `M ${x - height * 0.03} ${base - height * 0.12} h ${height * 0.06} v ${height * 0.14} h ${-height * 0.06} Z`;
  return <path key={key} d={d} fill={color} />;
}

function treeRow(rnd: Rnd, pts: Array<[number, number]>, color: string, size: [number, number], density: number, key: string, wind = false): ReactNode {
  const out: ReactNode[] = [];
  let x = -10 + rnd() * 10;
  let k = 0;
  while (x < W + 10) {
    const idx = Math.max(0, Math.min(pts.length - 1, Math.round(((x + 20) / (W + 40)) * (pts.length - 1))));
    const base = pts[idx]![1] + 4;
    const h = size[0] + rnd() * (size[1] - size[0]);
    out.push(pine(x, base, h, color, `${key}${k++}`));
    x += (h * 0.28 + rnd() * h * 0.5) / density;
  }
  // the whole row leans a little around its base line, like trees in a light wind
  const base = pts.reduce((sum, q) => sum + q[1], 0) / Math.max(1, pts.length);
  return (
    <g className={wind ? 'wind' : undefined} data-art-motion={wind ? undefined : 'wind'} data-period={9 + (key.charCodeAt(1) % 5) * 1.5} style={{ transformOrigin: `0px ${base.toFixed(1)}px`, animationDelay: `${-(key.charCodeAt(1) % 5)}s` }}>
      {out}
    </g>
  );
}

const f1 = (n: number) => n.toFixed(1);

/**
 * One palm frond: its spine leaves the crown at angle `a` and bends down under
 * its own weight (g); the blade is widest near the base and hangs below the spine.
 */
function frond(cx: number, cy: number, a: number, len: number, g: number, t: number): string {
  const upper: string[] = [];
  const lower: string[] = [];
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const x = cx + Math.cos(a) * len * u;
    const y = cy + Math.sin(a) * len * u + g * len * u * u;
    const dx = Math.cos(a) * len;
    const dy = Math.sin(a) * len + 2 * g * len * u;
    const d = Math.hypot(dx, dy) || 1;
    let nx = -dy / d;
    let ny = dx / d;
    if (ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const w = t * 2.4 * Math.pow(u, 0.35) * Math.pow(1 - u, 0.85);
    lower.push(`${f1(x + nx * w)} ${f1(y + ny * w)}`);
    upper.push(`${f1(x - nx * w * 0.35)} ${f1(y - ny * w * 0.35)}`);
  }
  return `M ${upper.join(' L ')} L ${lower.reverse().join(' L ')} Z`;
}

/**
 * A palm silhouette: a slender trunk curving from (bx, by) up to the crown at
 * (tx, ty), and a fountain of fronds that can sway gently around the crown.
 */
function palm(bx: number, by: number, tx: number, ty: number, size: number, color: string, key: string, sway: boolean, period = 7): ReactNode {
  const qx = bx + (tx - bx) * 0.12;
  const qy = by - (by - ty) * 0.6;
  const w0 = size * 0.04;
  const w1 = size * 0.024;
  const trunk = `M ${f1(bx - w0)} ${f1(by)} Q ${f1(qx - w0)} ${f1(qy)} ${f1(tx - w1)} ${f1(ty)} L ${f1(tx + w1)} ${f1(ty)} Q ${f1(qx + w0)} ${f1(qy)} ${f1(bx + w0)} ${f1(by)} Z`;
  // [angle°, length, droop]: a fan that rises and falls on both sides, plus two hanging fronds
  const spec: Array<[number, number, number]> = [
    [-162, 0.62, 0.95],
    [-136, 0.56, 0.85],
    [-106, 0.5, 0.7],
    [-74, 0.5, 0.7],
    [-44, 0.56, 0.85],
    [-18, 0.62, 0.95],
    [150, 0.42, 0.55],
    [28, 0.44, 0.55],
  ];
  const d = spec.map(([deg, l, g]) => frond(tx, ty, (deg * Math.PI) / 180, size * l, g, size * 0.05)).join(' ');
  return (
    <g key={key}>
      <path d={trunk} fill={color} />
      <g
        className={sway ? 'palm-sway' : undefined}
        data-art-motion={sway ? undefined : 'palm'}
        data-period={sway ? period : undefined}
        style={{ transformOrigin: `${f1(tx)}px ${f1(ty)}px`, animationDuration: `${period}s` }}
      >
        <path d={d} fill={color} />
        <circle cx={f1(tx)} cy={f1(ty + size * 0.015)} r={f1(size * 0.028)} fill={color} />
      </g>
    </g>
  );
}

export interface LandscapeProps {
  spec: ArtSpec;
  ratio?: number; // width / height
  uid: string;
  /** Hide stars (the animated Scene draws its own twinkling ones). */
  noStars?: boolean;
  /** Leave the sky transparent so animated layers can sit behind the land. */
  skyless?: boolean;
  detail?: 'card' | 'scene';
}

export function Landscape({ spec, ratio = 1, uid, noStars, skyless, detail = 'card' }: LandscapeProps): ReactNode {
  const p = PALETTES[spec.palette];
  const safeRatio = Number.isFinite(ratio) && ratio > 0 ? Math.min(4, Math.max(0.25, ratio)) : 1;
  const h = Math.round(W / safeRatio);
  const rnd = mulberry32(spec.seed * 9973 + 17);
  const id = (s: string) => `${uid}-${s}`;
  const horizon = h * horizonFor(spec.motif);
  const body = drawMotif(spec.motif, p, rnd, h, horizon, id, detail);

  return (
    <svg
      viewBox={`0 0 ${W} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset={((horizon / h) * 0.62).toFixed(3)} stopColor={p.sky[1]} />
          <stop offset={(horizon / h).toFixed(3)} stopColor={p.sky[2]} />
          <stop offset="1" stopColor={p.sky[2]} />
        </linearGradient>
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor={p.glow} stopOpacity="0.85" />
          <stop offset="0.35" stopColor={p.glow} stopOpacity="0.28" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('haze')} cx="0.5" cy="1" r="0.8">
          <stop offset="0" stopColor={p.sky[2]} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.sky[2]} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('fade')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.layers[3]} stopOpacity="0" />
          <stop offset="1" stopColor={p.layers[3]} stopOpacity="0.9" />
        </linearGradient>
        <filter id={id('blur')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id={id('soft')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      {!skyless && <rect width={W} height={h} fill={`url(#${id('sky')})`} />}
      {p.night && !noStars && starsGroup(rnd, h, detail === 'scene' ? 70 : 46, horizon / h, id('s'))}
      {body}
    </svg>
  );
}

export function horizonFor(m: Motif): number {
  switch (m) {
    case 'moon':
    case 'stars':
      return 0.74;
    case 'waves':
    case 'lighthouse':
      return 0.58;
    case 'lake':
      return 0.56;
    case 'beach':
      return 0.5;
    case 'clouds':
    case 'orb':
      return 0.8;
    case 'window':
      return 0.7;
    default:
      return 0.64;
  }
}

function celestial(p: Palette, cx: number, cy: number, r: number, id: (s: string) => string, moon: boolean): ReactNode {
  return (
    <g>
      <g data-art-motion="glow"><circle cx={cx} cy={cy} r={r * 5.5} fill={`url(#${id('glow')})`} /></g>
      <circle cx={cx} cy={cy} r={r} fill={p.celestial} data-celestial={moon ? 'moon' : 'sun'} />
      {moon && (
        <g opacity="0.1" fill={p.sky[1]}>
          <circle cx={cx - r * 0.3} cy={cy - r * 0.2} r={r * 0.22} />
          <circle cx={cx + r * 0.35} cy={cy + r * 0.25} r={r * 0.15} />
          <circle cx={cx + r * 0.05} cy={cy + r * 0.45} r={r * 0.1} />
        </g>
      )}
    </g>
  );
}

function mountains(p: Palette, rnd: Rnd, h: number, horizon: number, sharpness: number, count = 4, height = 1): ReactNode[] {
  const out: ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const y = horizon + (h - horizon) * (t * 0.62) - (1 - t) * h * 0.02;
    const amp = h * (0.26 - t * 0.16) * height;
    const pts = ridgePoints(rnd, W, { y: y + amp * 0.35, amp, freq: 2 + i * 0.9, sharp: Math.min(0.9, sharpness * 1.25 * (1 - t * 0.45)) });
    out.push(<path key={`m${i}`} d={smoothPath(pts, h + 2)} fill={p.layers[Math.min(3, i + (4 - count))]} />);
  }
  return out;
}

function hills(p: Palette, rnd: Rnd, h: number, horizon: number, count = 4): Array<{ node: ReactNode; pts: Array<[number, number]> }> {
  const out: Array<{ node: ReactNode; pts: Array<[number, number]> }> = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const y = horizon + (h - horizon) * t * 0.7;
    const amp = h * (0.1 - t * 0.04);
    const pts = ridgePoints(rnd, W, { y: y + amp * 0.3, amp, freq: 1.3 + i * 0.35, step: 10 });
    out.push({ node: <path key={`h${i}`} d={smoothPath(pts, h + 2)} fill={p.layers[Math.min(3, i + (4 - count))]} />, pts });
  }
  return out;
}

function drawMotif(
  m: Motif,
  p: Palette,
  rnd: Rnd,
  h: number,
  horizon: number,
  id: (s: string) => string,
  detail: 'card' | 'scene',
): ReactNode {
  const cx = W * (0.3 + rnd() * 0.4);
  switch (m) {
    case 'mountains': {
      return (
        <g>
          {celestial(p, cx, horizon - h * 0.26, W * 0.055, id, p.night)}
          <rect data-art-motion="mist" x="-20" y={horizon - h * 0.2} width={W + 40} height={h * 0.4} fill={`url(#${id('haze')})`} />
          {mountains(p, rnd, h, horizon, 0.55)}
        </g>
      );
    }
    case 'hills': {
      return (
        <g>
          {celestial(p, cx, horizon - h * 0.18, W * 0.07, id, p.night)}
          {hills(p, rnd, h, horizon).map((x) => x.node)}
        </g>
      );
    }
    case 'sun': {
      const r = W * 0.13;
      return (
        <g>
          <g data-art-motion="glow"><circle cx={W / 2} cy={horizon} r={r * 6} fill={`url(#${id('glow')})`} /></g>
          <circle cx={W / 2} cy={horizon - r * 0.15} r={r} fill={p.celestial} />
          {hills(p, rnd, h, horizon + h * 0.02, 3).map((x) => x.node)}
        </g>
      );
    }
    case 'moon': {
      const r = W * 0.09;
      return (
        <g>
          {celestial(p, W * 0.62, h * 0.3, r, id, true)}
          {hills(p, rnd, h, horizon, 3).map((x) => x.node)}
        </g>
      );
    }
    case 'lake': {
      const peaks = mountains(p, rnd, horizon + h * 0.02, horizon - h * 0.04, 0.5, 3, 0.85);
      const cy = horizon - h * 0.28;
      return (
        <g>
          {celestial(p, cx, cy, W * 0.05, id, p.night)}
          <g>{peaks}</g>
          <rect y={horizon} width={W} height={h - horizon} fill={p.water} />
          <g transform={`translate(0 ${horizon * 2}) scale(1 -1)`} opacity="0.26" filter={`url(#${id('soft')})`}>
            <rect y={horizon - h * 0.5} width={W} height={h * 0.5} fill={`url(#${id('sky')})`} opacity="0.7" />
            {peaks}
          </g>
          <ellipse cx={cx} cy={horizon + (horizon - cy) * 0.9} rx={W * 0.04} ry={h * 0.12} fill={p.celestial} opacity="0.18" filter={`url(#${id('soft')})`} />
          {Array.from({ length: 9 }, (_, i) => {
            const y = horizon + (h - horizon) * (0.12 + i * 0.1);
            const len = W * (0.06 + rnd() * 0.12);
            return (
              <g key={i} data-art-motion="ripple" style={{ animationDelay: `${-i * 0.7}s` }}>
                <rect x={cx - len / 2 + (rnd() - 0.5) * 30} y={y} width={len} height="1.2" rx="0.6" fill={p.celestial} opacity={0.08 + rnd() * 0.12} />
              </g>
            );
          })}
          <rect y={h * 0.9} width={W} height={h * 0.1} fill={`url(#${id('fade')})`} />
        </g>
      );
    }
    case 'waves': {
      const r = W * 0.075;
      const bands: ReactNode[] = [];
      for (let i = 0; i < 5; i++) {
        const t = i / 4;
        const y = horizon + (h - horizon) * (0.05 + t * 0.78);
        const amp = 2 + t * 10;
        const freq = 3 + rnd() * 2;
        const phase = rnd() * 6;
        let d = `M -10 ${h + 2} L -10 ${y}`;
        for (let x = -10; x <= W + 10; x += 10) {
          const yy = y + Math.sin((x / W) * Math.PI * freq + phase) * amp + Math.sin((x / W) * Math.PI * freq * 2.7 + phase) * amp * 0.3;
          d += ` L ${x} ${yy.toFixed(1)}`;
        }
        d += ` L ${W + 10} ${h + 2} Z`;
        const color = mixHex(p.water, p.layers[Math.min(3, i)], 0.5 + t * 0.5);
        bands.push(
          detail === 'scene' ? (
            <g key={i} className="swell" data-period={7 + i * 1.7} data-delay={-i * 1.3}>
              <path d={d} fill={color} />
            </g>
          ) : (
            <g key={i} data-art-motion="wave" style={{ animationDuration: `${7 + i * 1.7}s`, animationDelay: `${-i * 1.3}s` }}><path d={d} fill={color} /></g>
          ),
        );
      }
      return (
        <g>
          {celestial(p, W / 2, horizon - r * 1.1, r, id, p.night)}
          <rect y={horizon} width={W} height={h - horizon} fill={p.water} />
          <rect x={W / 2 - r * 0.9} y={horizon} width={r * 1.8} height={(h - horizon) * 0.8} fill={p.celestial} opacity="0.16" filter={`url(#${id('soft')})`} />
          {bands}
        </g>
      );
    }
    case 'forest': {
      const hs = hills(p, rnd, h, horizon, 3);
      return (
        <g>
          {celestial(p, cx, horizon - h * 0.22, W * 0.055, id, p.night)}
          {mountains(p, rnd, horizon + h * 0.05, horizon - h * 0.06, 0.4, 2, 0.8)}
          {hs[0]!.node}
          {treeRow(rnd, hs[0]!.pts, p.layers[1], [h * 0.07, h * 0.12], 1.1, 'ta', detail === 'scene')}
          {hs[1]!.node}
          {treeRow(rnd, hs[1]!.pts, p.layers[2], [h * 0.12, h * 0.2], 0.9, 'tb', detail === 'scene')}
          {hs[2]!.node}
          {treeRow(rnd, hs[2]!.pts, p.layers[3], [h * 0.2, h * 0.34], 0.75, 'tc', detail === 'scene')}
        </g>
      );
    }
    case 'dunes': {
      const out: ReactNode[] = [];
      for (let i = 0; i < 4; i++) {
        const t = i / 3;
        const y = horizon + (h - horizon) * t * 0.72;
        const pts = ridgePoints(rnd, W, { y: y + h * 0.04, amp: h * (0.1 - t * 0.03), freq: 0.9 + i * 0.3, step: 12 });
        out.push(<path key={i} d={smoothPath(pts, h + 2)} fill={p.layers[i]} />);
      }
      return (
        <g>
          {celestial(p, cx, horizon - h * 0.2, W * 0.06, id, p.night)}
          {out}
        </g>
      );
    }
    case 'aurora': {
      const ribbons: ReactNode[] = [];
      for (let i = 0; i < 3; i++) {
        const baseY = h * (0.18 + i * 0.1);
        let d = `M -20 ${baseY}`;
        for (let x = -20; x <= W + 20; x += 20) d += ` L ${x} ${(baseY + Math.sin(x / 60 + i * 2 + rnd()) * 18).toFixed(1)}`;
        ribbons.push(
          <path
            key={i}
            data-art-motion="aurora"
            style={{ animationDelay: `${-i * 3}s` }}
            d={d}
            stroke={p.accent[i % 3]}
            strokeWidth={26 - i * 5}
            fill="none"
            opacity={0.55 - i * 0.12}
            filter={`url(#${id('blur')})`}
          />,
        );
      }
      return (
        <g>
          <g style={{ mixBlendMode: 'screen' }}>{ribbons}</g>
          {mountains({ ...p, layers: [mixHex(p.layers[0], '#ffffff', 0.35), p.layers[1], p.layers[2], p.layers[3]] }, rnd, h, horizon, 0.7)}
        </g>
      );
    }
    case 'clouds': {
      const clouds: ReactNode[] = [];
      for (let i = 0; i < 4; i++) {
        const y = h * (0.45 + i * 0.13);
        const color = mixHex(p.sky[2], p.layers[i], 0.35 + i * 0.18);
        const puffs: ReactNode[] = [];
        let x = -30;
        let k = 0;
        while (x < W + 40) {
          const r = h * (0.05 + rnd() * 0.07) * (1 + i * 0.25);
          puffs.push(<circle key={k++} cx={x} cy={y + (rnd() - 0.5) * r * 0.5} r={r} />);
          x += r * (1.1 + rnd() * 0.5);
        }
        clouds.push(
          <g key={i} fill={color} data-art-motion="cloud" style={{ animationDuration: `${17 + i * 4}s`, animationDelay: `${-i * 4}s` }}>
            {puffs}
            <rect x="-10" y={y} width={W + 20} height={h} />
          </g>,
        );
      }
      return (
        <g>
          {celestial(p, cx, h * 0.3, W * 0.07, id, p.night)}
          {clouds}
        </g>
      );
    }
    case 'orb': {
      return (
        <g>
          <circle cx={W * 0.35} cy={h * 0.42} r={W * 0.28} fill={p.accent[0]} opacity="0.55" filter={`url(#${id('blur')})`} />
          <circle cx={W * 0.68} cy={h * 0.58} r={W * 0.24} fill={p.accent[2]} opacity="0.55" filter={`url(#${id('blur')})`} />
          <circle cx={W * 0.5} cy={h * 0.5} r={W * 0.2} fill={p.accent[1]} opacity="0.45" filter={`url(#${id('blur')})`} />
          <circle data-art-motion="resonance" cx={W * 0.5} cy={h * 0.5} r={W * 0.17} fill="none" stroke={p.celestial} strokeOpacity="0.55" strokeWidth="1.2" />
          <circle cx={W * 0.5} cy={h * 0.5} r={W * 0.1} fill={p.celestial} opacity="0.85" />
          <circle data-art-motion="resonance" style={{ animationDelay: '-3s' }} cx={W * 0.5} cy={h * 0.5} r={W * 0.28} fill="none" stroke={p.celestial} strokeOpacity="0.18" strokeWidth="0.8" />
        </g>
      );
    }
    case 'rain': {
      const lines: ReactNode[] = [];
      const count = detail === 'scene' ? 0 : 70;
      for (let i = 0; i < count; i++) {
        const x = rnd() * (W + 60) - 30;
        const y = rnd() * h;
        const len = 10 + rnd() * 18;
        lines.push(<line key={i} x1={x} y1={y} x2={x - len * 0.18} y2={y + len} stroke={p.celestial} strokeOpacity={0.12 + rnd() * 0.22} strokeWidth="0.8" />);
      }
      return (
        <g>
          {hills(p, rnd, h, horizon, 4).map((x) => x.node)}
          <g data-art-motion="rain" style={{ '--fall-distance': `${h}px` } as CSSProperties}>
            <g transform={`translate(0 ${-h})`}>{lines}</g>
            {lines}
          </g>
        </g>
      );
    }
    case 'stars': {
      const band: ReactNode = (
        <g transform={`rotate(-28 ${W / 2} ${h * 0.35})`}>
          <ellipse cx={W / 2} cy={h * 0.35} rx={W * 0.9} ry={h * 0.07} fill={p.accent[0]} opacity="0.16" filter={`url(#${id('blur')})`} />
          <ellipse cx={W / 2} cy={h * 0.35} rx={W * 0.6} ry={h * 0.03} fill={p.accent[1]} opacity="0.14" filter={`url(#${id('blur')})`} />
        </g>
      );
      return (
        <g>
          <g data-art-motion="glow">{band}</g>
          {starsGroup(rnd, h, 60, 0.7, id('st'))}
          {hills(p, rnd, h, horizon, 3).map((x) => x.node)}
        </g>
      );
    }
    case 'flame': {
      const fx = W / 2;
      const fy = h * 0.8;
      return (
        <g>
          {hills(p, rnd, h, horizon, 3).map((x) => x.node)}
          <g data-art-motion="glow"><circle cx={fx} cy={fy} r={W * 0.4} fill={p.glow} opacity="0.35" filter={`url(#${id('blur')})`} /></g>
          <path
            data-art-motion="flame"
            style={{ transformOrigin: `${fx}px ${fy}px` }}
            d={`M ${fx} ${fy - h * 0.2} C ${fx + W * 0.07} ${fy - h * 0.1}, ${fx + W * 0.06} ${fy - h * 0.02}, ${fx} ${fy} C ${fx - W * 0.06} ${fy - h * 0.02}, ${fx - W * 0.08} ${fy - h * 0.1}, ${fx} ${fy - h * 0.2} Z`}
            fill={p.accent[1]}
          />
          <path
            data-art-motion="flame"
            style={{ transformOrigin: `${fx}px ${fy}px`, animationDelay: '-0.6s', animationDuration: '2.1s' }}
            d={`M ${fx} ${fy - h * 0.12} C ${fx + W * 0.035} ${fy - h * 0.06}, ${fx + W * 0.03} ${fy - h * 0.01}, ${fx} ${fy} C ${fx - W * 0.03} ${fy - h * 0.01}, ${fx - W * 0.04} ${fy - h * 0.06}, ${fx} ${fy - h * 0.12} Z`}
            fill={p.accent[0]}
          />
          <rect x={fx - W * 0.09} y={fy - 2} width={W * 0.18} height="7" rx="3.5" fill={p.layers[3]} transform={`rotate(-8 ${fx} ${fy})`} />
          <rect x={fx - W * 0.09} y={fy - 2} width={W * 0.18} height="7" rx="3.5" fill={p.layers[3]} transform={`rotate(10 ${fx} ${fy})`} />
          {Array.from({ length: 10 }, (_, i) => (
            <g key={i} data-art-motion="ember" style={{ animationDelay: `${-i * 0.6}s` }}><circle cx={fx + (rnd() - 0.5) * W * 0.2} cy={fy - h * (0.22 + rnd() * 0.3)} r={0.8 + rnd()} fill={p.accent[0]} opacity={0.4 + rnd() * 0.5} /></g>
          ))}
        </g>
      );
    }
    case 'train': {
      const hs = hills(p, rnd, h, horizon + h * 0.08, 2);
      const railY = h * 0.8;
      const cars: ReactNode[] = [];
      const carW = W * 0.13;
      const startX = W * 0.14;
      for (let i = 0; i < 4; i++) {
        const x = startX + i * (carW + 3);
        cars.push(<rect key={`c${i}`} x={x} y={railY - h * 0.075} width={carW} height={h * 0.06} rx="2" fill={p.layers[3]} />);
        cars.push(<path key={`axle${i}`} d={`M ${x + 8} ${railY - 3} h ${carW - 16}`} stroke={p.layers[3]} strokeWidth="2" />);
        for (const wheelX of [x + 8, x + carW - 8]) {
          cars.push(
            <g key={`wheel${wheelX}`} data-art-motion="wheel">
              <circle cx={wheelX} cy={railY - 3} r="3" fill={p.layers[3]} stroke={p.layers[1]} strokeWidth="0.8" />
              <path d={`M ${wheelX - 2} ${railY - 3} h 4 M ${wheelX} ${railY - 5} v 4`} stroke={p.layers[1]} strokeWidth="0.7" />
            </g>,
          );
        }
        for (let k = 0; k < 4; k++) {
          cars.push(
            <rect key={`w${i}${k}`} x={x + 4 + k * ((carW - 8) / 4)} y={railY - h * 0.062} width={(carW - 8) / 4 - 3} height={h * 0.018} rx="1" fill={p.accent[0]} opacity="0.95" />,
          );
        }
      }
      const lx = startX + 4 * (carW + 3);
      return (
        <g>
          {celestial(p, W * 0.72, h * 0.25, W * 0.05, id, true)}
          {mountains(p, rnd, horizon + h * 0.06, horizon, 0.6, 2, 0.9)}
          {hs.map((x) => x.node)}
          <rect x="0" y={railY - 1} width={W} height="2" fill={p.layers[3]} />
          <g data-art-motion="train">
            <g data-art-motion="train-ride">
              <path d={`M ${lx + carW} ${railY - h * 0.042} l 75 -10 v 24 Z`} fill={p.accent[0]} opacity="0.12" />
              {cars}
              <path
                d={`M ${lx} ${railY - h * 0.015} L ${lx} ${railY - h * 0.075} L ${lx + carW * 0.55} ${railY - h * 0.075} L ${lx + carW * 0.55} ${railY - h * 0.11} L ${lx + carW * 0.72} ${railY - h * 0.11} L ${lx + carW * 0.72} ${railY - h * 0.075} Q ${lx + carW * 1.05} ${railY - h * 0.07} ${lx + carW * 1.02} ${railY - h * 0.015} Z`}
                fill={p.layers[3]}
              />
              <circle cx={lx + carW} cy={railY - h * 0.042} r="2" fill={p.celestial} />
              {Array.from({ length: 4 }, (_, i) => (
                <g key={i} data-art-motion="steam" style={{ animationDelay: `${-i * 1.1}s` }}>
                  <circle cx={lx + carW * 0.63} cy={railY - h * 0.13} r={4 + i * 1.5} fill={p.celestial} opacity="0.23" />
                </g>
              ))}
            </g>
          </g>
        </g>
      );
    }
    case 'beach': {
      const scene = detail === 'scene';
      const sunY = horizon - h * 0.22;
      const shoreY = horizon + (h - horizon) * 0.4;
      const shore = (dy: number) => `M -10 ${f1(shoreY - 8 + dy)} C ${f1(W * 0.25)} ${f1(shoreY - 16 + dy)} ${f1(W * 0.6)} ${f1(shoreY + 6 + dy)} ${W + 10} ${f1(shoreY + 14 + dy)}`;
      const islandX = W * (0.62 + rnd() * 0.12);
      // palms frame the view; on wide or short views they step back so the middle stays open
      const palmSize = Math.min(W * 0.42, h * 0.26);
      return (
        <g>
          <defs>
            <linearGradient id={id('sea')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={mixHex(p.water, p.sky[2], 0.35)} />
              <stop offset="0.45" stopColor={p.water} />
              <stop offset="1" stopColor={mixHex(p.water, '#9fe0d6', p.night ? 0.12 : 0.5)} />
            </linearGradient>
            {/* sand keeps a hint of the palette's light but always reads as sand (by moonlight, a silvery one) */}
            <linearGradient id={id('sand')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={mixHex(p.layers[2], '#d9bf99', p.night ? 0.12 : 0.6)} />
              <stop offset="0.12" stopColor={mixHex(p.layers[1], '#f1dcbc', p.night ? 0.12 : 0.6)} />
              <stop offset="1" stopColor={mixHex(mixHex(p.layers[1], p.layers[2], 0.55), '#e2c9a4', p.night ? 0.12 : 0.6)} />
            </linearGradient>
          </defs>
          {celestial(p, W / 2, sunY, Math.min(W * 0.055, h * 0.07), id, p.night)}
          <rect y={horizon} width={W} height={h - horizon} fill={`url(#${id('sea')})`} />
          {/* a low island far away */}
          <path
            d={`M ${f1(islandX - W * 0.2)} ${f1(horizon + 0.5)} Q ${f1(islandX - W * 0.08)} ${f1(horizon - h * 0.022)} ${f1(islandX)} ${f1(horizon - h * 0.018)} Q ${f1(islandX + W * 0.1)} ${f1(horizon - h * 0.014)} ${f1(islandX + W * 0.2)} ${f1(horizon + 0.5)} Z`}
            fill={p.layers[0]}
            opacity="0.75"
          />
          {/* the sun's path on the water */}
          <ellipse cx={W / 2} cy={f1(horizon + (shoreY - horizon) * 0.45)} rx={W * 0.045} ry={f1((shoreY - horizon) * 0.5)} fill={p.celestial} opacity="0.2" filter={`url(#${id('soft')})`} />
          {Array.from({ length: 7 }, (_, i) => {
            const y = horizon + (shoreY - horizon) * (0.1 + i * 0.12);
            const len = W * (0.05 + rnd() * 0.1) * (1 + i * 0.15);
            return <g key={i} data-art-motion="ripple" style={{ animationDelay: `${-i * 0.8}s` }}><rect x={f1(W / 2 - len / 2 + (rnd() - 0.5) * 24)} y={f1(y)} width={f1(len)} height="1.2" rx="0.6" fill={p.celestial} opacity={f1(0.12 + rnd() * 0.14)} /></g>;
          })}
          {/* the incoming wave and the shore */}
          {/* the animated groups fade in and out; the lines keep their own, lower opacity inside them */}
          <g className={scene ? 'tide' : undefined} data-art-motion={scene ? undefined : 'tide'} data-period={scene ? 6 : undefined}>
            <path d={shore(-(shoreY - horizon) * 0.12)} fill="none" stroke={p.accent[0]} strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
          </g>
          <path d={`${shore(0)} L ${W + 10} ${h + 2} L -10 ${h + 2} Z`} fill={`url(#${id('sand')})`} />
          {scene && (
            <g className="wash">
              <path d={`${shore(0)} L ${W + 10} ${f1(shoreY + 14 + (h - shoreY) * 0.1)} C ${f1(W * 0.6)} ${f1(shoreY + 6 + (h - shoreY) * 0.08)} ${f1(W * 0.25)} ${f1(shoreY - 16 + (h - shoreY) * 0.06)} -10 ${f1(shoreY - 8 + (h - shoreY) * 0.07)} Z`} fill={p.accent[0]} opacity="0.16" />
            </g>
          )}
          <g className={scene ? 'tide' : undefined} data-art-motion={scene ? undefined : 'tide'}>
            <path d={shore(0)} fill="none" stroke={p.accent[0]} strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
          </g>
          {h > W * 1.6
            ? palm(W * 0.97, h * 1.02, W * 0.87, horizon + h * 0.14, palmSize * 0.66, p.layers[3], id('p2'), scene, 8.5)
            : palm(W * 1.06, h * 1.02, W * 0.95, horizon + h * 0.12, palmSize * 0.66, p.layers[3], id('p2'), scene, 8.5)}
          {palm(W * 0.06, h * 1.02, W * (h > W * 1.6 ? 0.22 : 0.15), horizon - h * 0.1, palmSize, p.layers[3], id('p1'), scene, 7)}
        </g>
      );
    }
    case 'lighthouse': {
      const baseX = W * 0.68;
      const islandY = horizon + h * 0.03;
      const towerH = h * 0.3;
      return (
        <g>
          <rect y={horizon} width={W} height={h - horizon} fill={p.water} />
          <path
            data-art-motion="beacon"
            style={{ transformOrigin: `${baseX}px ${islandY - towerH}px` }}
            d={`M ${baseX} ${islandY - towerH} L ${baseX - W * 0.9} ${islandY - towerH - h * 0.1} L ${baseX - W * 0.9} ${islandY - towerH + h * 0.12} Z`}
            fill={p.celestial}
            opacity="0.16"
          />
          <path
            d={`M ${baseX - W * 0.22} ${islandY + 8} Q ${baseX - W * 0.1} ${islandY - h * 0.05} ${baseX} ${islandY - h * 0.03} Q ${baseX + W * 0.12} ${islandY - h * 0.05} ${baseX + W * 0.25} ${islandY + 8} Z`}
            fill={p.layers[3]}
          />
          <path d={`M ${baseX - W * 0.035} ${islandY - h * 0.03} L ${baseX - W * 0.022} ${islandY - towerH} L ${baseX + W * 0.022} ${islandY - towerH} L ${baseX + W * 0.035} ${islandY - h * 0.03} Z`} fill="#eef0f6" />
          <rect x={baseX - W * 0.03} y={islandY - towerH * 0.55} width={W * 0.06} height={towerH * 0.11} fill="#c96b6b" />
          <rect x={baseX - W * 0.026} y={islandY - towerH - h * 0.045} width={W * 0.052} height={h * 0.045} fill={p.accent[0]} />
          <g data-art-motion="glow"><circle cx={baseX} cy={islandY - towerH - h * 0.02} r={W * 0.12} fill={`url(#${id('glow')})`} /></g>
          <path d={`M ${baseX - W * 0.034} ${islandY - towerH - h * 0.045} L ${baseX} ${islandY - towerH - h * 0.075} L ${baseX + W * 0.034} ${islandY - towerH - h * 0.045} Z`} fill={p.layers[3]} />
          {Array.from({ length: 4 }, (_, i) => {
            const y = horizon + (h - horizon) * (0.25 + i * 0.2);
            let d = `M -10 ${h + 2} L -10 ${y}`;
            for (let x = -10; x <= W + 10; x += 12) d += ` L ${x} ${(y + Math.sin(x / (22 + i * 6) + i) * (2 + i * 2.5)).toFixed(1)}`;
            d += ` L ${W + 10} ${h + 2} Z`;
            return <g key={i} data-art-motion="wave" style={{ animationDelay: `${-i * 1.5}s` }}><path d={d} fill={mixHex(p.water, p.layers[3], 0.3 + i * 0.2)} /></g>;
          })}
        </g>
      );
    }
    case 'cabin': {
      const hs = hills(p, rnd, h, horizon, 3);
      const x = W * 0.58;
      const baseY = hs[2]!.pts[Math.round(((x + 20) / (W + 40)) * (hs[2]!.pts.length - 1))]![1] + 6;
      const cw = W * 0.2;
      const ch = h * 0.1;
      return (
        <g>
          {celestial(p, W * 0.25, h * 0.24, W * 0.045, id, p.night)}
          {hs[0]!.node}
          {treeRow(rnd, hs[0]!.pts, p.layers[1], [h * 0.07, h * 0.11], 1, 'ca', detail === 'scene')}
          {hs[1]!.node}
          {treeRow(rnd, hs[1]!.pts, p.layers[2], [h * 0.12, h * 0.18], 0.8, 'cb', detail === 'scene')}
          {hs[2]!.node}
          <g data-art-motion="glow"><circle cx={x} cy={baseY - ch * 0.5} r={W * 0.2} fill={p.accent[2]} opacity="0.3" filter={`url(#${id('blur')})`} /></g>
          <rect x={x - cw / 2} y={baseY - ch} width={cw} height={ch} fill={mixHex(p.layers[3], '#000000', 0.25)} />
          <path d={`M ${x - cw * 0.62} ${baseY - ch} L ${x} ${baseY - ch * 1.9} L ${x + cw * 0.62} ${baseY - ch} Z`} fill="#f4f7ff" />
          <rect x={x + cw * 0.18} y={baseY - ch * 2.05} width={cw * 0.1} height={ch * 0.55} fill={mixHex(p.layers[3], '#000000', 0.3)} />
          <rect x={x - cw * 0.3} y={baseY - ch * 0.7} width={cw * 0.22} height={ch * 0.36} rx="1" fill={p.accent[2]} />
          <rect x={x + cw * 0.08} y={baseY - ch * 0.7} width={cw * 0.22} height={ch * 0.36} rx="1" fill={p.accent[2]} />
          {Array.from({ length: 4 }, (_, i) => (
            <g key={i} data-art-motion="steam" style={{ animationDelay: `${-i * 1.1}s` }}><circle cx={x + cw * 0.23} cy={baseY - ch * 2.25} r={3 + i * 2} fill="#ffffff" opacity="0.22" /></g>
          ))}
          {treeRow(rnd, hs[2]!.pts.map(([px, py]) => [px, py + 4] as [number, number]).filter(([px]) => Math.abs(px - x) > cw * 0.9), p.layers[3], [h * 0.16, h * 0.26], 0.35, 'cc', detail === 'scene')}
          {detail === 'card' && <g data-art-motion="snow" style={{ '--fall-distance': `${h}px` } as CSSProperties}>
            {[0, -h].map((offset) => <g key={offset} transform={`translate(0 ${offset})`}>
              {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={(i * 73.7) % W} cy={(i * 47.3) % h} r={i % 3 === 0 ? 1.7 : 1} fill="#fff" opacity="0.55" />)}
            </g>)}
          </g>}
        </g>
      );
    }
    case 'window': {
      const drops: ReactNode[] = [];
      for (let i = 0; i < 38; i++) {
        const x = rnd() * W;
        const y = rnd() * h;
        const r = 1 + rnd() * 3.5;
        drops.push(<ellipse key={i} cx={x} cy={y} rx={r} ry={r * 1.25} fill={p.celestial} opacity={0.12 + rnd() * 0.2} />);
        if (rnd() < 0.3) drops.push(<rect key={`t${i}`} x={x - 0.5} y={y} width="1" height={10 + rnd() * 30} fill={p.celestial} opacity="0.08" />);
      }
      return (
        <g>
          {hills(p, rnd, h, horizon, 3).map((x) => x.node)}
          <circle cx={W * 0.82} cy={h * 0.92} r={W * 0.38} fill={p.accent[2]} opacity="0.35" filter={`url(#${id('blur')})`} />
          <g filter={`url(#${id('soft')})`}>
            <g data-art-motion="rain" style={{ '--fall-distance': `${h}px`, animationDuration: '14s' } as CSSProperties}>
              <g transform={`translate(0 ${-h})`}>{drops}</g>
              {drops}
            </g>
          </g>
          <rect x="0" y="0" width={W} height={h} fill="none" stroke={p.layers[3]} strokeWidth="22" />
          <rect x={W / 2 - 5} y="0" width="10" height={h} fill={p.layers[3]} />
          <rect x="0" y={h * 0.46} width={W} height="10" fill={p.layers[3]} />
        </g>
      );
    }
    case 'bamboo': {
      const stalks: ReactNode[] = [];
      for (let i = 0; i < 9; i++) {
        const x = (i / 8) * W + (rnd() - 0.5) * 30;
        const layer = i % 3;
        const color = p.layers[1 + layer]!;
        const w = 6 + layer * 3;
        const lean = (rnd() - 0.5) * 18;
        stalks.push(
          <g key={i}>
            <path d={`M ${x} ${h + 5} Q ${x + lean * 0.4} ${h * 0.5} ${x + lean} ${-10}`} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
            {Array.from({ length: 6 }, (_, k) => {
              const t = (k + 1) / 7;
              const yy = h + 5 - t * (h + 15);
              const xx = x + lean * t;
              return <rect key={k} x={xx - w / 2 - 1} y={yy} width={w + 2} height="2" fill={mixHex(color, '#000000', 0.3)} />;
            })}
            {Array.from({ length: 3 }, (_, k) => {
              const t = 0.3 + rnd() * 0.6;
              const yy = h + 5 - t * (h + 15);
              const xx = x + lean * t;
              const dir = rnd() < 0.5 ? -1 : 1;
              return (
                <path
                  key={`l${k}`}
                  d={`M ${xx} ${yy} q ${dir * 18} ${-6} ${dir * 34} ${4} q ${-dir * 16} ${2} ${-dir * 34} ${-4} Z`}
                  fill={color}
                />
              );
            })}
          </g>,
        );
      }
      return (
        <g>
          {celestial(p, cx, h * 0.3, W * 0.06, id, p.night)}
          <rect y={h * 0.5} width={W} height={h * 0.5} fill={`url(#${id('haze')})`} />
          {detail === 'scene' ? (
            <g className="wind" data-period={8} style={{ transformOrigin: `0px ${h}px` }}>
              {stalks}
            </g>
          ) : (
            <g data-art-motion="wind" style={{ transformOrigin: `0px ${h}px` }}>{stalks}</g>
          )}
        </g>
      );
    }
    case 'path': {
      const hs = hills(p, rnd, h, horizon, 3);
      const vx = W * (0.42 + rnd() * 0.16);
      return (
        <g>
          {celestial(p, vx, horizon - h * 0.15, W * 0.06, id, p.night)}
          {hs[0]!.node}
          {treeRow(rnd, hs[0]!.pts, p.layers[1], [h * 0.07, h * 0.12], 1, 'pa', detail === 'scene')}
          {hs[1]!.node}
          {hs[2]!.node}
          <path
            d={`M ${vx - 3} ${horizon + h * 0.08} C ${vx - 30} ${h * 0.8}, ${W * 0.2} ${h * 0.85}, ${W * 0.12} ${h + 2} L ${W * 0.62} ${h + 2} C ${W * 0.55} ${h * 0.85}, ${vx + 30} ${h * 0.8}, ${vx + 3} ${horizon + h * 0.08} Z`}
            fill={p.sky[2]}
            opacity="0.5"
          />
          {treeRow(rnd, hs[2]!.pts.filter(([px]) => px < W * 0.18 || px > W * 0.7), p.layers[3], [h * 0.22, h * 0.36], 0.5, 'pb')}
        </g>
      );
    }
  }
}
