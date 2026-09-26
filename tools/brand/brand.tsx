/**
 * Dev-only page used to render the PWA icons and the social preview image
 * (see tools/brand/render.mjs). Open /tools/brand/?asset=og|icon|maskable.
 */
import { createRoot } from 'react-dom/client';
import '../../src/styles/index.css';
import { Landscape } from '../../src/art/landscape';
import { LogoMark } from '../../src/components/Logo';

function Icon({ size, scale }: { size: number; scale: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(120% 120% at 50% 18%, #4a2a52 0%, #221528 55%, #150c19 100%)',
      }}
    >
      <LogoMark size={size * scale} />
    </div>
  );
}

function OG() {
  return (
    <div style={{ width: 1200, height: 630, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Landscape spec={{ palette: 'rose', motif: 'mountains', seed: 53 }} ratio={1200 / 630} uid="og" />
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(21,12,25,0.9) 0%, rgba(21,12,25,0.5) 52%, rgba(21,12,25,0.05) 100%)',
        }}
      />
      <div style={{ position: 'absolute', right: 90, top: 95, width: 330 }}>
        <img
          src="/eli/eli.jpg"
          alt=""
          style={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: 36, transform: 'rotate(-2deg)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 40px 80px -30px rgba(0,0,0,0.75)' }}
        />
      </div>
      <div style={{ position: 'absolute', left: 80, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#fdf3f5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <LogoMark size={64} />
          <span className="font-display" style={{ fontSize: 40 }}>
            Mindfulness <span style={{ fontStyle: 'italic', color: '#f7cbd6' }}>by Eli</span>
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: 70, lineHeight: 1.04, margin: '36px 0 0', maxWidth: 600 }}>
          Bajá un cambio
        </h1>
        <p style={{ fontSize: 27, margin: '20px 0 0', color: 'rgba(250,233,239,0.8)', maxWidth: 560, fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
          Meditaciones, respiración y descanso para mujeres que están todo el día resolviendo.
        </p>
      </div>
    </div>
  );
}

const asset = new URLSearchParams(location.search).get('asset') ?? 'og';
const size = Number(new URLSearchParams(location.search).get('size') ?? 512);
createRoot(document.getElementById('root')!).render(
  asset === 'og' ? <OG /> : <Icon size={size} scale={asset === 'maskable' ? 0.52 : 0.66} />,
);
