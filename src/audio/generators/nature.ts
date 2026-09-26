import {
  type Ctx,
  type SoundFactory,
  type SoundSource,
  Scheduler,
  chain,
  disconnectAll,
  filter,
  gain,
  lfo,
  loopBuffer,
  midiToHz,
  noise,
  noiseBuffer,
  panGains,
  panner,
  rand,
  randomTimes,
  rng,
  safeStop,
  textureBuffer,
} from '../dsp';

const TEX_SR = 32000;
const texCache = new WeakMap<Ctx, Map<string, AudioBuffer>>();
function cachedTexture(ctx: Ctx, key: string, make: () => AudioBuffer): AudioBuffer {
  let m = texCache.get(ctx);
  if (!m) texCache.set(ctx, (m = new Map()));
  let b = m.get(key);
  if (!b) m.set(key, (b = make()));
  return b;
}

function source(output: AudioNode, stoppables: AudioScheduledSourceNode[], nodes: AudioNode[], extra?: () => void): SoundSource {
  return {
    output,
    stop() {
      extra?.();
      safeStop(stoppables);
      disconnectAll(nodes);
    },
  };
}

// ───────────────────────────────────────────────────────────── rain

function dropsTexture(ctx: Ctx, variant: 'forest' | 'roof'): AudioBuffer {
  return cachedTexture(ctx, `drops-${variant}`, () =>
    textureBuffer(
      ctx,
      11,
      TEX_SR,
      (L, R, sr, r) => {
        const n = L.length;
        const density = variant === 'forest' ? 230 : 150;
        const count = Math.floor((n / sr) * density);
        for (let k = 0; k < count; k++) {
          const start = Math.floor(r() * n);
          const [gl, gr] = panGains(rand(-0.9, 0.9, r));
          const big = r() < (variant === 'roof' ? 0.28 : 0.08);
          const amp = (0.015 + 0.3 * Math.pow(r(), 3)) * (big ? 2.2 : 1);
          if (variant === 'roof' && big) {
            // metallic "tok": resonant decaying sine
            const f = rand(1100, 2600, r);
            const tau = rand(0.018, 0.05, r);
            const len = Math.floor(tau * 5 * sr);
            const w = (2 * Math.PI * f) / sr;
            for (let i = 0; i < len && start + i < n; i++) {
              const v = Math.sin(w * i) * Math.exp(-i / (tau * sr)) * amp * 0.8;
              L[start + i]! += v * gl;
              R[start + i]! += v * gr;
            }
            continue;
          }
          // small drop: a quick "plink" (falling sine) + a click
          const f0 = big ? rand(700, 1500, r) : rand(2200, 6200, r);
          const tau = big ? rand(0.01, 0.025, r) : rand(0.0025, 0.008, r);
          const len = Math.floor(tau * 6 * sr);
          let phase = 0;
          for (let i = 0; i < len && start + i < n; i++) {
            const t = i / sr;
            const f = f0 * (1 - 0.35 * Math.min(1, t / (tau * 3)));
            phase += (2 * Math.PI * f) / sr;
            const env = Math.exp(-t / tau);
            const click = i < 3 ? (r() * 2 - 1) * 0.6 : 0;
            const v = (Math.sin(phase) * 0.7 + click) * env * amp;
            L[start + i]! += v * gl;
            R[start + i]! += v * gr;
          }
        }
      },
      variant === 'forest' ? 17 : 23,
    ),
  );
}

export const rain: SoundFactory = (ctx) => {
  const out = gain(ctx, 1);
  const wash = noise(ctx, 'pink');
  const washF1 = filter(ctx, 'highpass', 480, 0.5);
  const washF2 = filter(ctx, 'lowpass', 7200, 0.5);
  const washG = gain(ctx, 0.32);
  chain(wash.node, washF1, washF2, washG, out);

  const body = noise(ctx, 'brown');
  const bodyF = filter(ctx, 'lowpass', 380, 0.6);
  const bodyG = gain(ctx, 0.2);
  chain(body.node, bodyF, bodyG, out);

  const drops = loopBuffer(ctx, dropsTexture(ctx, 'forest'), rand(0, 10));
  const dropsF = filter(ctx, 'highshelf', 5000, 0.7, -5);
  const dropsG = gain(ctx, 0.55);
  chain(drops, dropsF, dropsG, out);

  // second, sparser layer at a different speed so the texture never repeats
  const drops2 = loopBuffer(ctx, dropsTexture(ctx, 'forest'), rand(0, 10), 0.83);
  const drops2G = gain(ctx, 0.28);
  chain(drops2, filter(ctx, 'lowpass', 3800), drops2G, out);

  const swell = lfo(ctx, washG.gain, 0.045, 0.06);
  return source(out, [...wash.sources, ...body.sources, drops, drops2, swell], [out, washF1, washF2, washG, bodyF, bodyG, dropsF, dropsG, drops2G]);
};

export const roofRain: SoundFactory = (ctx) => {
  const out = gain(ctx, 1);
  const wash = noise(ctx, 'pink');
  const washG = gain(ctx, 0.2);
  chain(wash.node, filter(ctx, 'bandpass', 1800, 0.45), washG, out);
  const drops = loopBuffer(ctx, dropsTexture(ctx, 'roof'), rand(0, 10));
  const dropsG = gain(ctx, 0.75);
  chain(drops, filter(ctx, 'peaking', 1800, 1.2, 4), dropsG, out);
  const drops2 = loopBuffer(ctx, dropsTexture(ctx, 'roof'), rand(0, 10), 0.9);
  const drops2G = gain(ctx, 0.4);
  chain(drops2, filter(ctx, 'lowpass', 2600), drops2G, out);
  const body = noise(ctx, 'brown');
  const bodyG = gain(ctx, 0.16);
  chain(body.node, filter(ctx, 'lowpass', 300), bodyG, out);
  return source(out, [...wash.sources, drops, drops2, ...body.sources], [out, washG, dropsG, drops2G, bodyG]);
};

// ───────────────────────────────────────────────────────────── thunder

export const thunder: SoundFactory = (ctx, env) => {
  const out = gain(ctx, 1);
  const buf = noiseBuffer(ctx, 'brown');
  const white = noiseBuffer(ctx, 'white');
  const sends = gain(ctx, 0.9);
  sends.connect(env.reverb);
  const state = { next: ctx.currentTime + rand(4, 12) };
  const active: AudioBufferSourceNode[] = [];

  const strike = (t: number) => {
    const dur = rand(6, 11);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = filter(ctx, 'lowpass', 900, 0.8);
    const g = gain(ctx, 0);
    const p = panner(ctx, rand(-0.7, 0.7));
    chain(src, lp, g, p);
    p.connect(out);
    p.connect(sends);
    const close = Math.random() < 0.3;
    // rumbles: a few overlapping swells
    g.gain.setValueAtTime(0, t);
    let tt = t;
    const swells = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < swells; i++) {
      const peak = (i === 0 ? 1 : rand(0.4, 0.85)) * (close ? 1.1 : 0.75);
      g.gain.setTargetAtTime(peak, tt, i === 0 && close ? 0.03 : 0.25);
      tt += rand(0.6, 1.6);
      g.gain.setTargetAtTime(peak * 0.35, tt, 0.5);
    }
    g.gain.setTargetAtTime(0, tt, dur / 5);
    lp.frequency.setValueAtTime(close ? 1400 : 700, t);
    lp.frequency.setTargetAtTime(160, t + 0.3, dur / 4);
    src.start(t, rand(0, 8));
    src.stop(t + dur + 4);
    active.push(src);
    if (close) {
      const crack = ctx.createBufferSource();
      crack.buffer = white;
      const hp = filter(ctx, 'bandpass', 2400, 0.6);
      const cg = gain(ctx, 0);
      chain(crack, hp, cg, p);
      cg.gain.setValueAtTime(0, t);
      cg.gain.linearRampToValueAtTime(0.35, t + 0.01);
      cg.gain.setTargetAtTime(0, t + 0.02, 0.12);
      crack.start(t, rand(0, 5));
      crack.stop(t + 1.5);
      crack.onended = () => disconnectAll([crack, hp, cg]);
    }
    src.onended = () => {
      disconnectAll([src, lp, g, p]);
      const i = active.indexOf(src);
      if (i >= 0) active.splice(i, 1);
    };
  };

  const sched = new Scheduler(
    ctx,
    (from, to) => {
      for (const t of randomTimes(state, from, to, 16, 42)) strike(t);
    },
    env.horizon,
  );
  return source(out, active, [out, sends], () => sched.stop());
};

// ───────────────────────────────────────────────────────────── ocean

export const ocean: SoundFactory = (ctx, env) => {
  const out = gain(ctx, 1);
  const stops: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [out];

  // constant distant surf
  const bed = noise(ctx, 'brown');
  const bedG = gain(ctx, 0.22);
  chain(bed.node, filter(ctx, 'lowpass', 420, 0.5), bedG, out);
  stops.push(...bed.sources);
  nodes.push(bedG);

  const voices = [-0.55, 0.45].map((pan, idx) => {
    const src = noise(ctx, idx ? 'pink' : 'brown', false);
    const lp = filter(ctx, 'lowpass', 300, 0.6);
    const g = gain(ctx, 0.02);
    const p = panner(ctx, pan);
    chain(src.node, lp, g, p, out);
    // foam: bright hiss at the crest
    const foam = noise(ctx, 'white', false);
    const hp = filter(ctx, 'highpass', 2200, 0.5);
    const fg = gain(ctx, 0);
    chain(foam.node, hp, fg, p);
    stops.push(...src.sources, ...foam.sources);
    nodes.push(lp, g, p, hp, fg);
    return { lp, g, fg, state: { next: ctx.currentTime + idx * 5.5 } };
  });

  const wave = (v: (typeof voices)[number], t: number, period: number) => {
    const rise = period * rand(0.34, 0.42);
    const peak = rand(0.55, 1);
    v.g.gain.setTargetAtTime(peak, t, rise / 2.6);
    v.lp.frequency.setTargetAtTime(rand(1400, 2400), t, rise / 2.4);
    const crest = t + rise;
    v.fg.gain.setTargetAtTime(peak * 0.16, crest - 0.3, 0.25);
    v.fg.gain.setTargetAtTime(0, crest + 0.4, period * 0.16);
    v.g.gain.setTargetAtTime(0.05, crest, (period - rise) / 3);
    v.lp.frequency.setTargetAtTime(320, crest, (period - rise) / 2.8);
  };

  const sched = new Scheduler(
    ctx,
    (from, to) => {
      for (const v of voices) {
        if (v.state.next < from) v.state.next = from;
        while (v.state.next < to) {
          const period = rand(8.5, 13);
          wave(v, v.state.next, period);
          v.state.next += period;
        }
      }
    },
    env.horizon,
    3,
  );
  return source(out, stops, nodes, () => sched.stop());
};

// ───────────────────────────────────────────────────────────── lake (gentle lapping)

export const lake: SoundFactory = (ctx, env) => {
  const out = gain(ctx, 1);
  const bed = noise(ctx, 'pink');
  const bedF = filter(ctx, 'lowpass', 750, 0.5);
  const bedG = gain(ctx, 0.12);
  chain(bed.node, bedF, bedG, out);
  const mod = lfo(ctx, bedG.gain, 0.07, 0.04);

  const lap = noise(ctx, 'pink', false);
  const bp = filter(ctx, 'bandpass', 520, 0.9);
  const lg = gain(ctx, 0);
  const lp = panner(ctx, 0);
  chain(lap.node, bp, lg, lp, out);
  const state = { next: ctx.currentTime + 0.5 };

  const plop = (t: number) => {
    const o = ctx.createOscillator();
    const g = gain(ctx, 0);
    const p = panner(ctx, rand(-0.6, 0.6));
    const f = rand(260, 520);
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * rand(1.6, 2.4), t + 0.07);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(rand(0.04, 0.09), t + 0.008);
    g.gain.setTargetAtTime(0, t + 0.02, 0.025);
    chain(o, g, p, out);
    o.start(t);
    o.stop(t + 0.3);
    o.onended = () => disconnectAll([o, g, p]);
  };

  const sched = new Scheduler(
    ctx,
    (from, to) => {
      for (const t of randomTimes(state, from, to, 1.8, 3.8)) {
        const peak = rand(0.35, 0.8);
        lg.gain.setTargetAtTime(peak, t, 0.18);
        lg.gain.setTargetAtTime(0.02, t + 0.45, 0.4);
        bp.frequency.setTargetAtTime(rand(380, 900), t, 0.2);
        lp.pan.setTargetAtTime(rand(-0.5, 0.5), t, 0.3);
        if (Math.random() < 0.35) plop(t + rand(0.1, 0.6));
      }
    },
    env.horizon,
  );
  return source(out, [...bed.sources, ...lap.sources, mod], [out, bedF, bedG, bp, lg, lp], () => sched.stop());
};

// ───────────────────────────────────────────────────────────── stream / brook

function bubblesTexture(ctx: Ctx): AudioBuffer {
  return cachedTexture(ctx, 'bubbles', () =>
    textureBuffer(
      ctx,
      12,
      TEX_SR,
      (L, R, sr, r) => {
        const n = L.length;
        const count = Math.floor((n / sr) * 95);
        for (let k = 0; k < count; k++) {
          const start = Math.floor(r() * n);
          const f0 = rand(380, 1500, r);
          const dur = rand(0.012, 0.045, r);
          const amp = 0.04 + 0.28 * Math.pow(r(), 2.2);
          const [gl, gr] = panGains(rand(-0.8, 0.8, r));
          const len = Math.floor(dur * sr);
          let phase = 0;
          for (let i = 0; i < len && start + i < n; i++) {
            const t = i / len;
            const f = f0 * (1 + 1.8 * t * t);
            phase += (2 * Math.PI * f) / sr;
            const env = Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t);
            const v = Math.sin(phase) * env * amp;
            L[start + i]! += v * gl;
            R[start + i]! += v * gr;
          }
        }
      },
      31,
    ),
  );
}

export const stream: SoundFactory = (ctx) => {
  const out = gain(ctx, 1);
  const wash = noise(ctx, 'white');
  const bp = filter(ctx, 'bandpass', 1300, 0.7);
  const lp = filter(ctx, 'lowpass', 4500);
  const wg = gain(ctx, 0.12);
  chain(wash.node, bp, lp, wg, out);
  const m1 = lfo(ctx, wg.gain, 0.23, 0.03);
  const m2 = lfo(ctx, bp.frequency, 0.13, 250);
  const b1 = loopBuffer(ctx, bubblesTexture(ctx), rand(0, 10));
  const b1g = gain(ctx, 0.85);
  chain(b1, filter(ctx, 'lowpass', 5200), b1g, out);
  const b2 = loopBuffer(ctx, bubblesTexture(ctx), rand(0, 10), 0.77);
  const b2g = gain(ctx, 0.5);
  chain(b2, filter(ctx, 'lowpass', 3000), b2g, out);
  const low = noise(ctx, 'brown');
  const lowG = gain(ctx, 0.12);
  chain(low.node, filter(ctx, 'lowpass', 500), lowG, out);
  return source(out, [...wash.sources, m1, m2, b1, b2, ...low.sources], [out, bp, lp, wg, b1g, b2g, lowG]);
};

// ───────────────────────────────────────────────────────────── wind

export const wind: SoundFactory = (ctx, env) => {
  const out = gain(ctx, 1);
  const stops: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [out];
  const bands = [-0.6, 0.6].map((pan, i) => {
    const n = noise(ctx, 'pink', false);
    const bp = filter(ctx, 'bandpass', 500, 1.1);
    const g = gain(ctx, 0.3);
    const p = panner(ctx, pan);
    chain(n.node, bp, g, p, out);
    stops.push(...n.sources);
    nodes.push(bp, g, p);
    return { bp, g, i };
  });
  const whistle = noise(ctx, 'white', false);
  const wbp = filter(ctx, 'bandpass', 900, 14);
  const wg = gain(ctx, 0.05);
  chain(whistle.node, wbp, wg, out);
  const low = noise(ctx, 'brown');
  const lowG = gain(ctx, 0.2);
  chain(low.node, filter(ctx, 'lowpass', 170), lowG, out);
  stops.push(...whistle.sources, ...low.sources);
  nodes.push(wbp, wg, lowG);

  const state = { next: ctx.currentTime };
  const sched = new Scheduler(
    ctx,
    (from, to) => {
      for (const t of randomTimes(state, from, to, 1.4, 3.2)) {
        const gust = Math.pow(Math.random(), 1.6);
        for (const b of bands) {
          b.bp.frequency.setTargetAtTime(rand(260, 520) + gust * 520, t, rand(0.6, 1.4));
          b.g.gain.setTargetAtTime(0.14 + gust * rand(0.5, 0.75), t, rand(0.7, 1.5));
        }
        wbp.frequency.setTargetAtTime(rand(650, 1300), t, 1.2);
        wg.gain.setTargetAtTime(gust * 0.09, t, 1.1);
      }
    },
    env.horizon,
  );
  return source(out, stops, nodes, () => sched.stop());
};

// ───────────────────────────────────────────────────────────── birds

type Species = 'trino' | 'silbido' | 'chip' | 'tortola' | 'gorjeo';

interface Bird {
  species: Species;
  pan: number;
  pitch: number;
  distance: number;
  next: number;
  rate: [number, number];
}

export const birds: SoundFactory = (ctx, env) => {
  const out = gain(ctx, 1);
  const leaves = noise(ctx, 'pink');
  const lf = filter(ctx, 'bandpass', 3200, 0.6);
  const lg = gain(ctx, 0.05);
  chain(leaves.node, lf, lg, out);
  const lm = lfo(ctx, lg.gain, 0.09, 0.025);
  const amb = noise(ctx, 'pink');
  const ag = gain(ctx, 0.05);
  chain(amb.node, filter(ctx, 'lowpass', 1200), ag, out);
  const wet = gain(ctx, 0.5);
  wet.connect(env.reverb);

  const species: Species[] = ['trino', 'silbido', 'chip', 'tortola', 'gorjeo'];
  const flock: Bird[] = Array.from({ length: 5 }, (_, i) => {
    const sp = species[i % species.length]!;
    return {
      species: sp,
      pan: rand(-0.85, 0.85),
      pitch: rand(0.88, 1.15),
      distance: rand(0.25, 1),
      next: ctx.currentTime + rand(0.2, 4),
      rate: sp === 'tortola' ? [7, 14] : sp === 'silbido' ? [3, 8] : [2, 6],
    };
  });

  const tone = (t: number, dur: number, f0: number, f1: number, amp: number, bird: Bird, vib = 0) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    const g = gain(ctx, 0);
    const p = panner(ctx, bird.pan);
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    let v: OscillatorNode | null = null;
    if (vib) {
      v = ctx.createOscillator();
      v.frequency.value = rand(18, 32);
      const vg = gain(ctx, vib);
      v.connect(vg).connect(o.frequency);
      v.start(t);
      v.stop(t + dur + 0.05);
    }
    const a = amp * (1 - bird.distance * 0.55);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a, t + Math.min(0.012, dur * 0.3));
    g.gain.setValueAtTime(a, t + dur * 0.6);
    g.gain.linearRampToValueAtTime(0, t + dur);
    chain(o, g, p);
    p.connect(out);
    const send = gain(ctx, 0.25 + bird.distance * 0.6);
    p.connect(send).connect(wet);
    o.start(t);
    o.stop(t + dur + 0.05);
    o.onended = () => disconnectAll([o, g, p, send, ...(v ? [v] : [])]);
  };

  const call = (b: Bird, t: number) => {
    const P = b.pitch;
    switch (b.species) {
      case 'trino': {
        const notes = 6 + Math.floor(Math.random() * 9);
        const base = rand(3600, 4800) * P;
        for (let i = 0; i < notes; i++) {
          const tt = t + i * rand(0.055, 0.07);
          tone(tt, 0.045, base * (1 + 0.04 * Math.sin(i)), base * 0.82, 0.07, b);
        }
        break;
      }
      case 'silbido': {
        const n = 1 + Math.floor(Math.random() * 3);
        let tt = t;
        for (let i = 0; i < n; i++) {
          const f0 = rand(2000, 2800) * P;
          const up = Math.random() < 0.5;
          const d = rand(0.22, 0.45);
          tone(tt, d, f0, up ? f0 * 1.25 : f0 * 0.82, 0.06, b, 35);
          tt += d + rand(0.08, 0.22);
        }
        break;
      }
      case 'chip': {
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          const f = rand(5200, 6800) * P;
          tone(t + i * rand(0.11, 0.2), 0.028, f, f * 0.6, 0.05, b);
        }
        break;
      }
      case 'tortola': {
        const f = rand(520, 600) * P;
        const seq: Array<[number, number]> = [
          [0, 0.32],
          [0.42, 0.62],
          [1.18, 0.34],
        ];
        for (const [off, d] of seq) tone(t + off, d, f * 0.94, f * 1.02, 0.05, b, 6);
        break;
      }
      case 'gorjeo': {
        let tt = t;
        const n = 4 + Math.floor(Math.random() * 5);
        for (let i = 0; i < n; i++) {
          const f0 = rand(2600, 4200) * P;
          const d = rand(0.05, 0.12);
          tone(tt, d, f0, f0 * rand(0.7, 1.35), 0.055, b, 60);
          tt += d + rand(0.02, 0.07);
        }
        break;
      }
    }
  };

  const sched = new Scheduler(
    ctx,
    (from, to) => {
      for (const b of flock) {
        if (b.next < from) b.next = from + rand(0, 2);
        while (b.next < to) {
          call(b, b.next);
          // birds sometimes answer themselves quickly, sometimes go quiet
          b.next += Math.random() < 0.25 ? rand(0.6, 1.4) : rand(b.rate[0], b.rate[1]);
        }
      }
    },
    env.horizon,
  );
  return source(out, [...leaves.sources, lm, ...amb.sources], [out, lf, lg, ag, wet], () => sched.stop());
};

// ───────────────────────────────────────────────────────────── crickets

function cricketTexture(ctx: Ctx, idx: number): AudioBuffer {
  return cachedTexture(ctx, `cricket-${idx}`, () => {
    const r = rng(100 + idx);
    const seconds = [5.3, 6.7, 7.9, 4.6, 8.3][idx % 5]!;
    return textureBuffer(
      ctx,
      seconds,
      TEX_SR,
      (L, R, sr) => {
        const n = L.length;
        const f = rand(4100, 5300, r);
        const pulseRate = rand(28, 44, r);
        const pulses = 2 + Math.floor(r() * 3);
        const chirpEvery = rand(0.32, 0.75, r);
        const [gl, gr] = panGains(rand(-0.9, 0.9, r));
        const amp = rand(0.35, 0.7, r);
        const w = (2 * Math.PI * f) / sr;
        const pulseLen = 1 / pulseRate;
        for (let c = 0; c * chirpEvery < seconds - 0.2; c++) {
          const cStart = (c * chirpEvery + rand(-0.01, 0.01, r)) * sr;
          const skip = r() < 0.08;
          if (skip) continue;
          for (let p = 0; p < pulses; p++) {
            const s0 = Math.floor(cStart + p * pulseLen * sr);
            const len = Math.floor(pulseLen * 0.55 * sr);
            for (let i = 0; i < len; i++) {
              const idx2 = s0 + i;
              if (idx2 < 0 || idx2 >= n) continue;
              const env = Math.sin((Math.PI * i) / len);
              const v = Math.sin(w * idx2) * env * amp * (1 - p * 0.08);
              L[idx2]! += v * gl;
              R[idx2]! += v * gr;
            }
          }
        }
      },
      200 + idx,
    );
  });
}

export const crickets: SoundFactory = (ctx, env) => {
  const out = gain(ctx, 1);
  const srcs: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [out];
  for (let i = 0; i < 5; i++) {
    const s = loopBuffer(ctx, cricketTexture(ctx, i), rand(0, 4));
    const near = i < 2;
    const g = gain(ctx, near ? 0.22 : 0.1);
    const lp = filter(ctx, 'lowpass', near ? 9000 : 6000);
    chain(s, lp, g, out);
    if (!near) {
      const send = gain(ctx, 0.5);
      g.connect(send).connect(env.reverb);
      nodes.push(send);
    }
    srcs.push(s);
    nodes.push(g, lp);
  }
  // distant chorus: band of noise pulsing like a far field of crickets
  const field = noise(ctx, 'white');
  const fb = filter(ctx, 'bandpass', 4700, 6);
  const fg = gain(ctx, 0.0);
  const amp = gain(ctx, 0.05);
  chain(field.node, fb, fg, amp, out);
  const pulse = ctx.createOscillator();
  pulse.frequency.value = 36;
  const pg = gain(ctx, 0.5);
  pulse.connect(pg).connect(fg.gain);
  pulse.start();
  const night = noise(ctx, 'brown');
  const ng = gain(ctx, 0.06);
  chain(night.node, filter(ctx, 'lowpass', 350), ng, out);
  srcs.push(...field.sources, pulse, ...night.sources);
  nodes.push(fb, fg, amp, pg, ng);
  return source(out, srcs, nodes);
};

// ───────────────────────────────────────────────────────────── wind chimes

export const chimes: SoundFactory = (ctx, env) => {
  const out = gain(ctx, 1);
  const wet = gain(ctx, 0.7);
  wet.connect(env.reverb);
  const scale = [81, 83, 85, 88, 90, 93, 95].map(midiToHz); // A major pentatonic, high
  const state = { next: ctx.currentTime + 1 };

  const strike = (t: number, f: number, amp: number, pan: number) => {
    const p = panner(ctx, pan);
    p.connect(out);
    p.connect(wet);
    const partials: Array<[number, number, number]> = [
      [1, 1, 2.6],
      [2.76, 0.42, 1.3],
      [5.4, 0.2, 0.6],
      [8.93, 0.08, 0.3],
    ];
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    for (const [ratio, a, decay] of partials) {
      const o = ctx.createOscillator();
      o.frequency.value = f * ratio;
      const g = gain(ctx, 0);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp * a, t + 0.003);
      g.gain.setTargetAtTime(0, t + 0.004, decay / 3);
      o.connect(g).connect(p);
      o.start(t);
      o.stop(t + decay * 2.2);
      oscs.push(o);
      gains.push(g);
    }
    oscs[0]!.onended = () => disconnectAll([...oscs, ...gains, p]);
  };

  const sched = new Scheduler(
    ctx,
    (from, to) => {
      for (const t of randomTimes(state, from, to, 3, 9)) {
        const hits = 2 + Math.floor(Math.random() * 6);
        let tt = t;
        for (let i = 0; i < hits; i++) {
          const f = scale[Math.floor(Math.random() * scale.length)]!;
          strike(tt, f, rand(0.03, 0.09), rand(-0.7, 0.7));
          tt += rand(0.08, 0.5);
        }
      }
    },
    env.horizon,
  );
  return source(out, [], [out, wet], () => sched.stop());
};
