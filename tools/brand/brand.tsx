/**
 * Dev-only page used to render the PWA icons and the social preview image
 * (see tools/brand/render.mjs). Open /tools/brand/?asset=og|icon|maskable.
 */
import { createRoot } from 'react-dom/client';
import '../../src/styles/index.css';
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
        background: '#17231f',
      }}
    >
      <LogoMark size={size * scale} />
    </div>
  );
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#f4f1e9' }}>
      <LogoMark size={72} />
      <div className="font-display" style={{ fontSize: 108, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 36 }}>
        Calma<span style={{ fontStyle: 'italic', color: '#c5d5bc' }}>byEli</span>
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 30, color: 'rgba(244,241,233,0.62)', marginTop: 28 }}>Un momento para vos.</div>
    </div>
  );
}

/** Deep green with the first light of dawn coming up behind the name. */
function OG() {
  return (
    <div style={{ width: 1200, height: 630, position: 'relative', overflow: 'hidden', background: '#17231f' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '100%',
          width: 1500,
          height: 1000,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(closest-side, rgba(214,222,194,0.17), rgba(172,195,159,0.07) 45%, rgba(23,35,31,0) 72%)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Wordmark />
      </div>
    </div>
  );
}

const params = new URLSearchParams(location.search);
const asset = params.get('asset') ?? 'og';
const size = Number(params.get('size') ?? 512);
createRoot(document.getElementById('root')!).render(
  asset === 'og' ? <OG /> : <Icon size={size} scale={asset === 'maskable' ? 0.52 : 0.64} />,
);
