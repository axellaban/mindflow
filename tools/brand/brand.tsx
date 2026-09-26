/**
 * Dev-only page used to render the PWA icons and the social preview image
 * (see tools/brand/render.mjs). Open /tools/brand/?asset=og|icon|maskable.
 */
import { createRoot } from 'react-dom/client';
import '../../src/styles/index.css';
import { Landscape } from '../../src/art/landscape';

function Mark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size}>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd6bd" />
          <stop offset="0.55" stopColor="#cfc6ff" />
          <stop offset="1" stopColor="#8fe0dc" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#g)" />
      <path d="M6.5 27.5c4.2-3.2 8.3-3.2 12.5 0s8.3 3.2 12.5 0 8.3-3.2 12 0" fill="none" stroke="#0a0f28" strokeOpacity="0.55" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M9 33.5c3.6-2.4 7.2-2.4 10.8 0s7.2 2.4 10.8 0 7.2-2.4 9.4 0" fill="none" stroke="#0a0f28" strokeOpacity="0.3" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="17" r="4.2" fill="#fff" fillOpacity="0.9" />
    </svg>
  );
}

function Icon({ size, scale }: { size: number; scale: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(120% 120% at 50% 20%, #26306e 0%, #0e1433 55%, #070b1e 100%)',
      }}
    >
      <Mark size={size * scale} />
    </div>
  );
}

function OG() {
  return (
    <div style={{ width: 1200, height: 630, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Landscape spec={{ palette: 'dusk', motif: 'lake', seed: 11 }} ratio={1200 / 630} uid="og" />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,11,30,0.85) 0%, rgba(7,11,30,0.35) 55%, rgba(7,11,30,0) 100%)' }} />
      <div style={{ position: 'absolute', left: 80, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#f6f4ff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Mark size={64} />
          <span className="font-display" style={{ fontSize: 44 }}>MindFlow</span>
        </div>
        <h1 className="font-display" style={{ fontSize: 76, lineHeight: 1.02, margin: '36px 0 0', maxWidth: 640 }}>
          Encuentra tu calma
        </h1>
        <p style={{ fontSize: 28, margin: '20px 0 0', color: 'rgba(236,234,255,0.78)', maxWidth: 600, fontFamily: 'var(--font-sans)' }}>
          Meditaciones guiadas, historias para dormir, respiración y paisajes sonoros.
        </p>
      </div>
    </div>
  );
}

const asset = new URLSearchParams(location.search).get('asset') ?? 'og';
const size = Number(new URLSearchParams(location.search).get('size') ?? 512);
createRoot(document.getElementById('root')!).render(
  asset === 'og' ? <OG /> : <Icon size={size} scale={asset === 'maskable' ? 0.5 : 0.64} />,
);
