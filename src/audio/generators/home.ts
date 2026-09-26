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
  noise,
  panGains,
  panner,
  rand,
  safeStop,
  textureBuffer,
} from '../dsp';

const TEX_SR = 32000;
const cache = new WeakMap<Ctx, Map<string, AudioBuffer>>();
function cached(ctx: Ctx, key: string, make: () => AudioBuffer): AudioBuffer {
  let m = cache.get(ctx);
  if (!m) cache.set(ctx, (m = new Map()));
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

// ───────────────────────────────────────────────────────────── fire

function crackleTexture(ctx: Ctx): AudioBuffer {
  return cached(ctx, 'crackle', () =>
    textureBuffer(
      ctx,
      13,
      TEX_SR,
      (L, R, sr, r) => {
        const n = L.length;
        let t = 0;
        while (t < n / sr) {
          // bursts of clicks, clustered like real embers
          t += -Math.log(1 - r()) / 7; // ~7 bursts per second
          const clicks = 1 + Math.floor(Math.pow(r(), 2) * 7);
          const [gl, gr] = panGains(rand(-0.7, 0.7, r));
          const burstAmp = 0.08 + 0.7 * Math.pow(r(), 3.2);
          let ct = t;
          for (let c = 0; c < clicks; c++) {
            ct += rand(0.002, 0.03, r);
            const start = Math.floor(ct * sr);
            const pop = r() < 0.12;
            const tau = pop ? rand(0.003, 0.009, r) : rand(0.0004, 0.0018, r);
            const len = Math.floor(tau * 7 * sr);
            let hp = 0;
            let prev = 0;
            const amp = burstAmp * rand(0.4, 1, r) * (pop ? 1.3 : 1);
            for (let i = 0; i < len; i++) {
              const idx = start + i;
              if (idx >= n) break;
              const w = r() * 2 - 1;
              // one-pole high-pass for crisp clicks, low-passed for pops
              hp = pop ? 0.7 * hp + 0.3 * w : 0.6 * (hp + w - prev);
              prev = w;
              const v = hp * Math.exp(-i / (tau * sr)) * amp;
              L[idx]! += v * gl;
              R[idx]! += v * gr;
            }
          }
        }
      },
      41,
    ),
  );
}

export const fire: SoundFactory = (ctx, env) => {
  const out = gain(ctx, 1);
  const roar = noise(ctx, 'brown');
  const rf = filter(ctx, 'lowpass', 420, 0.7);
  const rg = gain(ctx, 0.38);
  chain(roar.node, rf, rg, out);
  const hiss = noise(ctx, 'white');
  const hf = filter(ctx, 'highpass', 3200, 0.6);
  const hg = gain(ctx, 0.035);
  chain(hiss.node, hf, filter(ctx, 'lowpass', 9000), hg, out);
  const c1 = loopBuffer(ctx, crackleTexture(ctx), rand(0, 12));
  const c1g = gain(ctx, 0.75);
  chain(c1, c1g, out);
  const c2 = loopBuffer(ctx, crackleTexture(ctx), rand(0, 12), 0.87);
  const c2g = gain(ctx, 0.35);
  chain(c2, filter(ctx, 'lowpass', 2500), c2g, out);

  const state = { next: ctx.currentTime };
  const sched = new Scheduler(
    ctx,
    (from, to) => {
      for (;;) {
        if (state.next < from) state.next = from;
        if (state.next >= to) break;
        const t = state.next;
        const flare = Math.random();
        rg.gain.setTargetAtTime(0.28 + flare * 0.22, t, 0.18);
        rf.frequency.setTargetAtTime(320 + flare * 380, t, 0.25);
        hg.gain.setTargetAtTime(0.02 + flare * 0.03, t, 0.3);
        state.next += rand(0.25, 0.8);
      }
    },
    env.horizon,
  );
  return source(out, [...roar.sources, ...hiss.sources, c1, c2], [out, rf, rg, hf, hg, c1g, c2g], () => sched.stop());
};

// ───────────────────────────────────────────────────────────── train

export const train: SoundFactory = (ctx, env) => {
  const out = gain(ctx, 1);
  const rumble = noise(ctx, 'brown');
  const rug = gain(ctx, 0.4);
  chain(rumble.node, filter(ctx, 'lowpass', 260, 0.8), rug, out);
  const mid = noise(ctx, 'pink');
  const mf = filter(ctx, 'bandpass', 420, 0.6);
  const mg = gain(ctx, 0.26);
  chain(mid.node, mf, mg, out);
  const wob = lfo(ctx, mg.gain, 0.21, 0.07);
  const wob2 = lfo(ctx, mf.frequency, 0.07, 60);
  const wheels = gain(ctx, 1);
  wheels.connect(out);
  const white = noise(ctx, 'white', false);
  const clackF = filter(ctx, 'bandpass', 1700, 2.2);
  const clackG = gain(ctx, 0);
  chain(white.node, clackF, clackG, wheels);
  const thumpO = ctx.createOscillator();
  thumpO.frequency.value = 120;
  const thumpG = gain(ctx, 0);
  chain(thumpO, thumpG, wheels);
  thumpO.start();

  const hit = (t: number, amp: number) => {
    clackG.gain.setValueAtTime(0, t);
    clackG.gain.linearRampToValueAtTime(amp * 1.1, t + 0.003);
    clackG.gain.setTargetAtTime(0, t + 0.004, 0.018);
    thumpG.gain.setValueAtTime(0, t);
    thumpG.gain.linearRampToValueAtTime(amp * 0.5, t + 0.004);
    thumpG.gain.setTargetAtTime(0, t + 0.006, 0.04);
  };

  let tempo = 1.28;
  const state = { next: ctx.currentTime + 0.3 };
  const sched = new Scheduler(
    ctx,
    (from, to) => {
      if (state.next < from) state.next = from;
      while (state.next < to) {
        const t = state.next;
        const a = rand(0.75, 1);
        hit(t, a);
        hit(t + 0.125, a * 0.8);
        hit(t + 0.55, a * 0.9);
        hit(t + 0.675, a * 0.72);
        tempo = Math.min(1.42, Math.max(1.16, tempo + rand(-0.015, 0.015)));
        state.next += tempo;
      }
    },
    env.horizon,
  );
  return source(
    out,
    [...rumble.sources, ...mid.sources, wob, wob2, ...white.sources, thumpO],
    [out, rug, mf, mg, wheels, clackF, clackG, thumpG],
    () => sched.stop(),
  );
};

// ───────────────────────────────────────────────────────────── fan

export const fan: SoundFactory = (ctx) => {
  const out = gain(ctx, 1);
  const air = noise(ctx, 'pink');
  const af = filter(ctx, 'lowpass', 1500, 0.5);
  const ag = gain(ctx, 0.55);
  chain(air.node, af, ag, out);
  const body = noise(ctx, 'brown');
  const bg = gain(ctx, 0.3);
  chain(body.node, filter(ctx, 'lowpass', 400), bg, out);
  const hum = ctx.createOscillator();
  hum.frequency.value = 118;
  const hum2 = ctx.createOscillator();
  hum2.frequency.value = 236.4;
  const hg = gain(ctx, 0.012);
  hum.connect(hg);
  hum2.connect(hg);
  hg.connect(out);
  hum.start();
  hum2.start();
  const blade = lfo(ctx, ag.gain, 7.6, 0.03);
  return source(out, [...air.sources, ...body.sources, hum, hum2, blade], [out, af, ag, bg, hg]);
};

// ───────────────────────────────────────────────────────────── cat purr

export const purr: SoundFactory = (ctx, env) => {
  const out = gain(ctx, 1);
  const n = noise(ctx, 'pink', false);
  const lp = filter(ctx, 'lowpass', 650, 0.9);
  const body = gain(ctx, 0);
  const level = gain(ctx, 0.9);
  chain(n.node, lp, body, level, panner(ctx, 0.15), out);
  // pulse train shaping the noise at ~25 Hz
  const pulse = ctx.createOscillator();
  pulse.type = 'sawtooth';
  pulse.frequency.value = 25;
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    curve[i] = Math.pow(Math.max(0, Math.sin(Math.PI * x)), 3);
  }
  shaper.curve = curve;
  pulse.connect(shaper).connect(body.gain);
  pulse.start();

  let inhale = true;
  const state = { next: ctx.currentTime };
  const sched = new Scheduler(
    ctx,
    (from, to) => {
      if (state.next < from) state.next = from;
      while (state.next < to) {
        const t = state.next;
        const d = inhale ? rand(1.3, 1.7) : rand(1.7, 2.2);
        pulse.frequency.setTargetAtTime(inhale ? 27 : 23.5, t, 0.08);
        level.gain.setTargetAtTime(inhale ? 0.55 : 0.95, t, 0.15);
        lp.frequency.setTargetAtTime(inhale ? 760 : 560, t, 0.2);
        state.next += d;
        inhale = !inhale;
      }
    },
    env.horizon,
  );
  return source(out, [...n.sources, pulse], [out, lp, body, level, shaper], () => sched.stop());
};

// ───────────────────────────────────────────────────────────── colored noise

export function coloredNoise(color: 'white' | 'pink' | 'brown'): SoundFactory {
  return (ctx) => {
    const out = gain(ctx, 1);
    const n = noise(ctx, color);
    const tone =
      color === 'white'
        ? filter(ctx, 'lowpass', 11000, 0.5)
        : color === 'pink'
          ? filter(ctx, 'lowpass', 9000, 0.5)
          : filter(ctx, 'lowpass', 2400, 0.5);
    const g = gain(ctx, color === 'white' ? 0.32 : color === 'pink' ? 0.55 : 0.7);
    chain(n.node, tone, g, out);
    return source(out, n.sources, [out, tone, g]);
  };
}
