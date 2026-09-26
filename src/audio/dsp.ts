/**
 * Low-level helpers shared by the procedural sound generators.
 * Everything here works with any BaseAudioContext so sounds can also be
 * rendered offline (used to calibrate loudness).
 */

export type Ctx = BaseAudioContext;

export interface SynthEnv {
  /** Destination for reverb sends. */
  reverb: AudioNode;
  /** Seconds of events to schedule on start (large for offline rendering). */
  horizon: number;
}

export interface SoundSource {
  /** Node that carries the sound (already started). */
  output: AudioNode;
  /** Stop everything and free resources. Called after the layer faded out. */
  stop(): void;
}

export type SoundFactory = (ctx: Ctx, env: SynthEnv) => SoundSource;

export function rng(seed = Math.random() * 2 ** 32): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = (min: number, max: number, r: () => number = Math.random) => min + (max - min) * r();

export const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

// ─────────────────────────────────────────────────────────── noise buffers

type NoiseColor = 'white' | 'pink' | 'brown';
const noiseCache = new WeakMap<Ctx, Partial<Record<NoiseColor, AudioBuffer>>>();

export function noiseBuffer(ctx: Ctx, color: NoiseColor, seconds = 9): AudioBuffer {
  let bank = noiseCache.get(ctx);
  if (!bank) {
    bank = {};
    noiseCache.set(ctx, bank);
  }
  const cached = bank[color];
  if (cached) return cached;
  const sr = ctx.sampleRate;
  const n = Math.floor(seconds * sr);
  const buf = ctx.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  const r = rng(color === 'white' ? 1 : color === 'pink' ? 2 : 3);
  if (color === 'white') {
    for (let i = 0; i < n; i++) d[i] = r() * 2 - 1;
  } else if (color === 'pink') {
    // Paul Kellet's refined pink filter
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = r() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else {
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = r() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  // crossfade the loop point so the seam is inaudible
  const fade = Math.floor(sr * 0.25);
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    const a = d[i]!;
    const b = d[n - fade + i]!;
    d[n - fade + i] = b * (1 - t) + a * t;
  }
  normalize(d, 0.9);
  bank[color] = buf;
  return buf;
}

function normalize(d: Float32Array, peak: number): void {
  let m = 0;
  for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i]!));
  if (m > 0) {
    const g = peak / m;
    for (let i = 0; i < d.length; i++) d[i]! *= g;
  }
}

/** Looping noise; stereo uses two decorrelated read positions. */
export function noise(ctx: Ctx, color: NoiseColor, stereo = true): { node: AudioNode; sources: AudioBufferSourceNode[] } {
  const buf = noiseBuffer(ctx, color);
  const make = (offset: number) => {
    const s = ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.start(ctx.currentTime, offset);
    return s;
  };
  if (!stereo) {
    const s = make(0);
    return { node: s, sources: [s] };
  }
  const l = make(0);
  const r = make(buf.duration * 0.47);
  const merger = ctx.createChannelMerger(2);
  l.connect(merger, 0, 0);
  r.connect(merger, 0, 1);
  return { node: merger, sources: [l, r] };
}

// ─────────────────────────────────────────────────────────── node helpers

export function filter(
  ctx: Ctx,
  type: BiquadFilterType,
  frequency: number,
  Q = 0.707,
  gain = 0,
): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  f.Q.value = Q;
  f.gain.value = gain;
  return f;
}

export function gain(ctx: Ctx, value = 1): GainNode {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
}

export function panner(ctx: Ctx, pan: number): StereoPannerNode {
  const p = ctx.createStereoPanner();
  p.pan.value = Math.max(-1, Math.min(1, pan));
  return p;
}

export function chain(...nodes: AudioNode[]): AudioNode {
  for (let i = 0; i < nodes.length - 1; i++) nodes[i]!.connect(nodes[i + 1]!);
  return nodes[nodes.length - 1]!;
}

/** Slow sine LFO driving an AudioParam around its current value. */
export function lfo(ctx: Ctx, param: AudioParam, rate: number, depth: number, type: OscillatorType = 'sine'): OscillatorNode {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = rate;
  const g = ctx.createGain();
  g.gain.value = depth;
  o.connect(g).connect(param);
  o.start();
  return o;
}

export function safeStop(nodes: Array<AudioScheduledSourceNode | null | undefined>): void {
  for (const n of nodes) {
    try {
      n?.stop();
    } catch {
      /* already stopped */
    }
  }
}

export function disconnectAll(nodes: AudioNode[]): void {
  for (const n of nodes) {
    try {
      n.disconnect();
    } catch {
      /* noop */
    }
  }
}

// ─────────────────────────────────────────────────────────── scheduling

/**
 * Lookahead scheduler: calls `schedule(from, to)` so callers place events with
 * sample accuracy in the audio clock. Survives timer throttling in background tabs.
 */
export class Scheduler {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private until: number;
  private stopped = false;

  constructor(
    private ctx: Ctx,
    private schedule: (from: number, to: number) => void,
    horizon: number,
    private lookahead = 1.8,
  ) {
    this.until = ctx.currentTime;
    this.extend(ctx.currentTime + Math.max(horizon, lookahead));
    if (!(ctx instanceof OfflineAudioContext)) this.loop();
  }

  private extend(to: number): void {
    if (to <= this.until) return;
    const from = this.until;
    this.until = to;
    this.schedule(from, to);
  }

  private loop = (): void => {
    if (this.stopped) return;
    this.extend(this.ctx.currentTime + this.lookahead);
    this.timer = setTimeout(this.loop, 250);
  };

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }
}

/** Iterate Poisson-like random event times within [from, to). */
export function randomTimes(
  state: { next: number },
  from: number,
  to: number,
  minGap: number,
  maxGap: number,
  r: () => number = Math.random,
): number[] {
  const out: number[] = [];
  if (state.next < from) state.next = from + rand(0, maxGap * 0.5, r);
  while (state.next < to) {
    out.push(state.next);
    state.next += rand(minGap, maxGap, r);
  }
  return out;
}

// ─────────────────────────────────────────────────────────── offline buffers

/** Render a stereo texture buffer by summing short events (drops, crackles, bubbles…). */
export function textureBuffer(
  ctx: Ctx,
  seconds: number,
  sampleRate: number,
  write: (L: Float32Array, R: Float32Array, sr: number, r: () => number) => void,
  seed = 7,
): AudioBuffer {
  const n = Math.floor(seconds * sampleRate);
  const buf = ctx.createBuffer(2, n, sampleRate);
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  write(L, R, sampleRate, rng(seed));
  // wrap-around crossfade for seamless looping
  const fade = Math.floor(sampleRate * 0.12);
  for (const ch of [L, R]) {
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      ch[n - fade + i] = ch[n - fade + i]! * (1 - t) + ch[i]! * t;
    }
  }
  let m = 0;
  for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(L[i]!), Math.abs(R[i]!));
  if (m > 0.95) {
    const g = 0.95 / m;
    for (let i = 0; i < n; i++) {
      L[i]! *= g;
      R[i]! *= g;
    }
  }
  return buf;
}

export function loopBuffer(ctx: Ctx, buf: AudioBuffer, offset = 0, rate = 1): AudioBufferSourceNode {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  s.playbackRate.value = rate;
  s.start(ctx.currentTime, offset % buf.duration);
  return s;
}

/** Pan helper for manual stereo writes: equal-power gains. */
export function panGains(pan: number): [number, number] {
  const p = (Math.max(-1, Math.min(1, pan)) + 1) * 0.25 * Math.PI;
  return [Math.cos(p), Math.sin(p)];
}

// ─────────────────────────────────────────────────────────── reverb

export function impulseResponse(ctx: Ctx, seconds = 3.4, decay = 2.6, seed = 5): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(seconds * sr);
  const buf = ctx.createBuffer(2, n, sr);
  const r = rng(seed);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const env = Math.pow(1 - t, decay) * Math.exp(-3 * t);
      // darker as it decays (air absorption)
      const coef = 0.25 + 0.7 * t;
      lp = coef * lp + (1 - coef) * (r() * 2 - 1);
      d[i] = lp * env;
    }
    // soft pre-delay / early reflections
    const early = [0.011, 0.019, 0.027, 0.041, 0.053];
    early.forEach((sec, k) => {
      const idx = Math.floor(sec * sr) + ch * 7;
      if (idx < n) d[idx]! += (k % 2 ? -1 : 1) * (0.6 - k * 0.09);
    });
  }
  return buf;
}
