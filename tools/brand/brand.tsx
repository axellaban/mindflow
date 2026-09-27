/**
 * Dev-only page used to render the PWA icons and the social preview image
 * (see tools/brand/render.mjs). Open /tools/brand/?asset=og|icon|maskable.
 */
import { createRoot } from 'react-dom/client';
import '../../src/styles/index.css';
import { LogoMark } from '../../src/components/Logo';
import { ELI } from '../../src/content/eli';

function Icon({ size, scale }: { size: number; scale: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f2330',
      }}
    >
      <LogoMark size={size * scale} />
    </div>
  );
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#f7f1e6' }}>
      <LogoMark size={72} />
      <div className="font-display" style={{ fontSize: 108, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 36 }}>
        Calma<span style={{ fontStyle: 'italic', color: '#a8dcd5' }}>byEli</span>
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 30, color: 'rgba(247,241,230,0.62)', marginTop: 28 }}>Un momento para vos.</div>
    </div>
  );
}

/** Deep sea with the first light of dawn coming up behind the name. */
function OG() {
  return (
    <div style={{ width: 1200, height: 630, position: 'relative', overflow: 'hidden', background: '#0f2330' }}>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '100%',
          width: 1500,
          height: 1000,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(closest-side, rgba(247,220,192,0.16), rgba(124,197,191,0.08) 45%, rgba(15,35,48,0) 72%)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Wordmark />
      </div>
    </div>
  );
}

/** Link preview for Eli's page (/eli), shared from her Instagram and WhatsApp. */
function OGEli() {
  return (
    <div style={{ width: 1200, height: 630, position: 'relative', overflow: 'hidden', background: '#0f2330', display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          position: 'absolute',
          left: '28%',
          top: '50%',
          width: 1100,
          height: 900,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(closest-side, rgba(247,220,192,0.14), rgba(124,197,191,0.07) 48%, rgba(15,35,48,0) 72%)',
        }}
      />
      <img
        src={ELI.photo}
        alt=""
        style={{
          position: 'relative',
          marginLeft: 96,
          width: 360,
          height: 450,
          objectFit: 'cover',
          borderRadius: 40,
          border: '1px solid rgba(255,255,255,0.16)',
          boxShadow: '0 40px 80px -30px rgba(0,0,0,0.75)',
        }}
      />
      <div style={{ position: 'relative', marginLeft: 72, color: '#f7f1e6', maxWidth: 560 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, letterSpacing: '0.16em', color: '#a8dcd5', textTransform: 'uppercase' }}>
          Sesiones 1:1 online
        </div>
        <div className="font-display" style={{ fontSize: 96, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 18 }}>
          Hola, soy Eli
        </div>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 30, lineHeight: 1.35, color: 'rgba(247,241,230,0.72)', marginTop: 26 }}>
          Mindfulness para bajar un cambio, soltar la autoexigencia y descansar de verdad.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 44 }}>
          <LogoMark size={44} />
          <div className="font-display" style={{ fontSize: 34, lineHeight: 1 }}>
            Calma<span style={{ fontStyle: 'italic', color: '#a8dcd5' }}>byEli</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const params = new URLSearchParams(location.search);
const asset = params.get('asset') ?? 'og';
const size = Number(params.get('size') ?? 512);
createRoot(document.getElementById('root')!).render(
  asset === 'og' ? <OG /> : asset === 'og-eli' ? <OGEli /> : <Icon size={size} scale={asset === 'maskable' ? 0.52 : 0.64} />,
);
