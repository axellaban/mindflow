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
  midiToHz,
  noise,
  panner,
  rand,
  rng,
  safeStop,
} from '../dsp';

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

// ───────────────────────────────────────────────────────────── note rendering

const NOTE_SR = 32000;
const noteCache = new WeakMap<Ctx, Map<string, AudioBuffer>>();

function renderNote(ctx: Ctx, key: string, seconds: number, fn: (d: Float32Array, sr: number) => void): AudioBuffer {
  let m = noteCache.get(ctx);
  if (!m) noteCache.set(ctx, (m = new Map()));
  const hit = m.get(key);
  if (hit) return hit;
  const n = Math.floor(seconds * NOTE_SR);
  const buf = ctx.createBuffer(1, n, NOTE_SR);
  const d = buf.getChannelData(0);
  fn(d, NOTE_SR);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(d[i]!));
  if (peak > 0) for (let i = 0; i < n; i++) d[i]! *= 0.9 / peak;
  const fade = Math.floor(0.3 * NOTE_SR);
  for (let i = 0; i < fade; i++) d[n - fade + i]! *= 1 - i / fade;
  m.set(key, buf);
  return buf;
}

/** Soft felt piano: inharmonic partials, two-stage decay, detuned unisons, a hint of hammer. */
function pianoNote(ctx: Ctx, midi: number): AudioBuffer {
  return renderNote(ctx, `piano-${midi}`, 6.5, (d, sr) => {
    const f0 = midiToHz(midi);
    const B = 0.00035;
    const low = Math.max(0, Math.min(1, (72 - midi) / 30));
    const r = rng(midi * 13);
    for (let n = 1; n <= 14; n++) {
      const f = f0 * n * Math.sqrt(1 + B * n * n);
      if (f > sr / 2.3) break;
      const amp = Math.pow(n, -1.35) * (n === 1 ? 1 : 0.85) * Math.exp(-n * 0.12);
      const t1 = (0.35 + low * 0.5) / (1 + 0.35 * n);
      const t2 = (2.6 + low * 3) / (1 + 0.22 * n);
      const det = f * 0.0006;
      const ph1 = r() * 6.28;
      const ph2 = r() * 6.28;
      const w1 = (2 * Math.PI * (f - det)) / sr;
      const w2 = (2 * Math.PI * (f + det)) / sr;
      const k1 = Math.exp(-1 / (t1 * sr));
      const k2 = Math.exp(-1 / (t2 * sr));
      let e1 = 0.55;
      let e2 = 0.45;
      for (let i = 0; i < d.length; i++) {
        d[i]! += amp * (e1 + e2) * 0.5 * (Math.sin(w1 * i + ph1) + Math.sin(w2 * i + ph2));
        e1 *= k1;
        e2 *= k2;
        if (e1 + e2 < 1e-4) break;
      }
    }
    // hammer: short, dark thump
    let lp = 0;
    const hl = Math.floor(0.012 * sr);
    for (let i = 0; i < hl; i++) {
      lp = 0.85 * lp + 0.15 * (r() * 2 - 1);
      d[i]! += lp * Math.exp(-i / (0.003 * sr)) * 0.5;
    }
    const atk = Math.floor(0.0025 * sr);
    for (let i = 0; i < atk; i++) d[i]! *= i / atk;
  });
}

function kalimbaNote(ctx: Ctx, midi: number): AudioBuffer {
  return renderNote(ctx, `kalimba-${midi}`, 3.2, (d, sr) => {
    const f0 = midiToHz(midi);
    const parts: Array<[number, number, number]> = [
      [1, 1, 1.25],
      [2, 0.06, 0.4],
      [5.95, 0.24, 0.09],
      [8.9, 0.07, 0.05],
    ];
    for (const [ratio, a, tau] of parts) {
      const w = (2 * Math.PI * f0 * ratio) / sr;
      const k = Math.exp(-1 / (tau * sr));
      let e = a;
      for (let i = 0; i < d.length && e > 1e-5; i++) {
        d[i]! += e * Math.sin(w * i);
        e *= k;
      }
    }
    const atk = Math.floor(0.002 * sr);
    for (let i = 0; i < atk; i++) d[i]! *= i / atk;
  });
}

// ───────────────────────────────────────────────────────────── helpers

function playBuffer(ctx: Ctx, buf: AudioBuffer, t: number, amp: number, pan: number, dest: AudioNode, rate = 1): void {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.playbackRate.value = rate;
  const g = gain(ctx, amp);
  const p = panner(ctx, pan);
  chain(s, g, p, dest);
  s.start(t);
  s.onended = () => disconnectAll([s, g, p]);
}

function busWithReverb(ctx: Ctx, reverb: AudioNode, dry: number, wet: number): { input: GainNode; out: GainNode; nodes: AudioNode[] } {
  const input = gain(ctx, 1);
  const out = gain(ctx, 1);
  const d = gain(ctx, dry);
  const w = gain(ctx, wet);
  input.connect(d).connect(out);
  input.connect(w).connect(reverb);
  return { input, out, nodes: [input, out, d, w] };
}

// ───────────────────────────────────────────────────────────── pads ("Horizonte")

const PAD_CHORDS = [
  [50, 57, 64, 66, 73], // Dmaj9
  [47, 54, 62, 69, 76], // Bm11
  [43, 50, 59, 66, 69], // Gmaj9
  [45, 52, 59, 62, 67], // A7sus4
  [50, 57, 62, 66, 71], // D6/9
  [42, 54, 61, 64, 69], // F#m7
  [43, 55, 62, 66, 74], // Gmaj7
  [45, 57, 64, 67, 71], // Aadd9
];

export const pads: SoundFactory = (ctx, env) => {
  const bus = busWithReverb(ctx, env.reverb, 0.6, 0.75);
  const master = gain(ctx, 1);
  bus.out.connect(master);
  const tone = filter(ctx, 'lowpass', 1250, 0.4);
  tone.connect(bus.input);
  const sweep = lfo(ctx, tone.frequency, 0.025, 380);
  const voices: Array<{ oscs: OscillatorNode[]; g: GainNode; nodes: AudioNode[] }> = [];
  let idx = 0;
  const state = { next: ctx.currentTime };

  const chord = (t: number, dur: number) => {
    const notes = PAD_CHORDS[idx % PAD_CHORDS.length]!;
    idx++;
    const g = gain(ctx, 0);
    g.connect(tone);
    const oscs: OscillatorNode[] = [];
    const nodes: AudioNode[] = [g];
    notes.forEach((m, i) => {
      const pan = panner(ctx, (i / (notes.length - 1)) * 1.4 - 0.7);
      pan.connect(g);
      nodes.push(pan);
      const f = midiToHz(m);
      const vg = gain(ctx, i === 0 ? 0.26 : 0.16);
      vg.connect(pan);
      nodes.push(vg);
      for (const cents of [-7, 6]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = f;
        o.detune.value = cents + rand(-2, 2);
        o.connect(vg);
        o.start(t);
        o.stop(t + dur + 8);
        oscs.push(o);
      }
      if (i === 0) {
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = f / 2;
        const sg = gain(ctx, 0.9);
        sub.connect(sg).connect(vg);
        sub.start(t);
        sub.stop(t + dur + 8);
        oscs.push(sub);
        nodes.push(sg);
      }
    });
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 5.5);
    g.gain.setValueAtTime(0.3, t + dur);
    g.gain.linearRampToValueAtTime(0, t + dur + 7.5);
    const v = { oscs, g, nodes };
    voices.push(v);
    oscs[0]!.onended = () => {
      disconnectAll([...oscs, ...nodes]);
      const k = voices.indexOf(v);
      if (k >= 0) voices.splice(k, 1);
    };
    // shimmer: a soft high chord tone that blooms and fades
    if (Math.random() < 0.8) {
      const top = notes[2 + Math.floor(Math.random() * 3)]! + 12;
      const o = ctx.createOscillator();
      o.frequency.value = midiToHz(top);
      const sg = gain(ctx, 0);
      const sp = panner(ctx, rand(-0.6, 0.6));
      chain(o, sg, sp, bus.input);
      const st = t + rand(3, 6);
      sg.gain.setValueAtTime(0, st);
      sg.gain.linearRampToValueAtTime(0.04, st + 3);
      sg.gain.linearRampToValueAtTime(0, st + 9);
      o.start(st);
      o.stop(st + 9.5);
      o.onended = () => disconnectAll([o, sg, sp]);
    }
  };

  const sched = new Scheduler(
    ctx,
    (from, to) => {
      if (state.next < from) state.next = from;
      while (state.next < to) {
        const dur = rand(11, 15);
        chord(state.next, dur);
        state.next += dur;
      }
    },
    env.horizon,
    3,
  );

  return {
    output: master,
    stop() {
      sched.stop();
      safeStop([sweep, ...voices.flatMap((v) => v.oscs)]);
      disconnectAll([master, tone, ...bus.nodes, ...voices.flatMap((v) => v.nodes)]);
    },
  };
};

// ───────────────────────────────────────────────────────────── generative piano

/** Loops of different lengths drifting in and out of phase (after Eno's "Music for Airports"). */
const PIANO_LOOPS: Array<{ notes: number[]; period: number; gap: number }> = [
  { notes: [68, 65], period: 19.7, gap: 0.9 }, // Ab4 F4
  { notes: [72], period: 23.3, gap: 0 }, // C5
  { notes: [73, 68], period: 29.1, gap: 1.2 }, // Db5 Ab4
  { notes: [63], period: 17.8, gap: 0 }, // Eb4
  { notes: [77, 75], period: 31.9, gap: 1.1 }, // F5 Eb5
  { notes: [56, 60], period: 37.3, gap: 1.6 }, // Ab3 C4
  { notes: [61], period: 26.3, gap: 0 }, // Db4
  { notes: [80], period: 43.7, gap: 0 }, // Ab5
];

export const piano: SoundFactory = (ctx, env) => {
  const bus = busWithReverb(ctx, env.reverb, 0.55, 0.85);
  const master = gain(ctx, 0.95);
  const warm = filter(ctx, 'lowpass', 5200, 0.5);
  chain(bus.out, warm, master);
  const r = rng();
  const loops = PIANO_LOOPS.map((l) => ({ ...l, next: ctx.currentTime + rand(0.5, l.period * 0.6, r) }));
  const sched = new Scheduler(
    ctx,
    (from, to) => {
      for (const l of loops) {
        if (l.next < from) l.next = from + rand(0, 2);
        while (l.next < to) {
          l.notes.forEach((m, i) => {
            const vel = rand(0.35, 0.6, r);
            playBuffer(ctx, pianoNote(ctx, m), l.next + i * l.gap, vel, rand(-0.5, 0.5, r), bus.input);
          });
          l.next += l.period;
        }
      }
    },
    env.horizon,
    3,
  );
  return source(master, [], [master, warm, ...bus.nodes], () => sched.stop());
};

// ───────────────────────────────────────────────────────────── kalimba

const KALIMBA_SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79]; // C major pentatonic

export const kalimba: SoundFactory = (ctx, env) => {
  const bus = busWithReverb(ctx, env.reverb, 0.6, 0.6);
  const master = gain(ctx, 0.8);
  // dreamy echo
  const delay = ctx.createDelay(2);
  delay.delayTime.value = 0.46;
  const fb = gain(ctx, 0.32);
  const dlp = filter(ctx, 'lowpass', 2600);
  bus.input.connect(delay);
  chain(delay, dlp, fb, delay);
  const dOut = gain(ctx, 0.35);
  dlp.connect(dOut).connect(bus.out);
  bus.out.connect(master);

  let pos = 4;
  const state = { next: ctx.currentTime + 0.4 };
  const beat = 60 / 76 / 2;
  const sched = new Scheduler(
    ctx,
    (from, to) => {
      if (state.next < from) state.next = from;
      while (state.next < to) {
        const phraseLen = 5 + Math.floor(Math.random() * 6);
        let t = state.next;
        for (let i = 0; i < phraseLen; i++) {
          if (Math.random() < 0.72) {
            pos = Math.max(0, Math.min(KALIMBA_SCALE.length - 1, pos + Math.round(rand(-2.4, 2.4))));
            const m = KALIMBA_SCALE[pos]!;
            playBuffer(ctx, kalimbaNote(ctx, m), t, rand(0.35, 0.55), rand(-0.4, 0.4), bus.input);
            if (Math.random() < 0.15) {
              const low = KALIMBA_SCALE[Math.max(0, pos - 2)]! - 12;
              playBuffer(ctx, kalimbaNote(ctx, low), t, 0.3, rand(-0.3, 0.3), bus.input);
            }
          }
          t += beat * (Math.random() < 0.2 ? 2 : 1) * (i % 2 ? 0.92 : 1.08);
        }
        state.next = t + rand(1.8, 4.2);
      }
    },
    env.horizon,
    3,
  );
  return source(master, [], [master, delay, fb, dlp, dOut, ...bus.nodes], () => sched.stop());
};

// ───────────────────────────────────────────────────────────── singing bowls

const BOWL_NOTES = [57, 60, 62, 65, 69, 50]; // A3 C4 D4 F4 A4 D3

export function strikeBowl(ctx: Ctx, dest: AudioNode, t: number, f0: number, amp: number, pan = 0, sing = false): void {
  const p = panner(ctx, pan);
  p.connect(dest);
  const partials: Array<[number, number, number]> = [
    [1, 1, 11],
    [2.71, 0.45, 7],
    [5.2, 0.18, 3.8],
    [8.35, 0.07, 2],
  ];
  const all: AudioNode[] = [p];
  let first: OscillatorNode | null = null;
  for (const [ratio, a, decay] of partials) {
    for (const beat of [-0.6, 0.7]) {
      const o = ctx.createOscillator();
      o.frequency.value = f0 * ratio + beat * (ratio > 1 ? 1.5 : 1);
      const g = gain(ctx, 0);
      if (sing) {
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(amp * a * 0.5, t + 3.5);
        g.gain.setTargetAtTime(0, t + 5, decay / 3);
      } else {
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(amp * a * 0.5, t + 0.006);
        g.gain.setTargetAtTime(0, t + 0.01, decay / 4.2);
      }
      o.connect(g).connect(p);
      o.start(t);
      o.stop(t + decay * 1.6 + (sing ? 5 : 0));
      all.push(o, g);
      if (!first) first = o;
    }
  }
  if (first) first.onended = () => disconnectAll(all);
}

export const bowls: SoundFactory = (ctx, env) => {
  const bus = busWithReverb(ctx, env.reverb, 0.6, 0.7);
  const master = gain(ctx, 0.85);
  bus.out.connect(master);
  const state = { next: ctx.currentTime + 0.3 };
  const sched = new Scheduler(
    ctx,
    (from, to) => {
      if (state.next < from) state.next = from;
      while (state.next < to) {
        const m = BOWL_NOTES[Math.floor(Math.random() * BOWL_NOTES.length)]!;
        const sing = Math.random() < 0.18;
        strikeBowl(ctx, bus.input, state.next, midiToHz(m), rand(0.18, 0.3), rand(-0.5, 0.5), sing);
        state.next += rand(7, 13);
      }
    },
    env.horizon,
    3,
  );
  return source(master, [], [master, ...bus.nodes], () => sched.stop());
};

// ───────────────────────────────────────────────────────────── crystal (FM bells)

const CRYSTAL = [77, 79, 81, 83, 84, 88, 89, 91]; // F lydian, high

export const crystal: SoundFactory = (ctx, env) => {
  const bus = busWithReverb(ctx, env.reverb, 0.45, 0.9);
  const master = gain(ctx, 0.75);
  bus.out.connect(master);
  // quiet bed so the bells float on something
  const bed = [53, 60, 64, 69].map((m, i) => {
    const o = ctx.createOscillator();
    o.frequency.value = midiToHz(m);
    const g = gain(ctx, 0.03);
    const p = panner(ctx, i % 2 ? 0.4 : -0.4);
    chain(o, g, p, bus.input);
    o.start();
    return { o, g, p };
  });
  const bell = (t: number, m: number) => {
    const f = midiToHz(m);
    const car = ctx.createOscillator();
    car.frequency.value = f;
    const mod = ctx.createOscillator();
    mod.frequency.value = f * 3.5;
    const idx = gain(ctx, 0);
    idx.gain.setValueAtTime(f * 2.2, t);
    idx.gain.setTargetAtTime(0, t, 0.35);
    mod.connect(idx).connect(car.frequency);
    const g = gain(ctx, 0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(rand(0.05, 0.1), t + 0.004);
    g.gain.setTargetAtTime(0, t + 0.01, 0.9);
    const p = panner(ctx, rand(-0.7, 0.7));
    chain(car, g, p, bus.input);
    car.start(t);
    mod.start(t);
    car.stop(t + 5);
    mod.stop(t + 5);
    car.onended = () => disconnectAll([car, mod, idx, g, p]);
  };
  const state = { next: ctx.currentTime + 0.5 };
  const sched = new Scheduler(
    ctx,
    (from, to) => {
      if (state.next < from) state.next = from;
      while (state.next < to) {
        const cluster = Math.random() < 0.35 ? 2 + Math.floor(Math.random() * 3) : 1;
        for (let i = 0; i < cluster; i++) bell(state.next + i * rand(0.12, 0.3), CRYSTAL[Math.floor(Math.random() * CRYSTAL.length)]!);
        state.next += rand(1.2, 3.6);
      }
    },
    env.horizon,
  );
  return source(
    master,
    bed.map((b) => b.o),
    [master, ...bus.nodes, ...bed.flatMap((b) => [b.g, b.p])],
    () => sched.stop(),
  );
};

// ───────────────────────────────────────────────────────────── deep drone

const DRONE_SETS = [
  [38, 45, 50, 57],
  [34, 41, 46, 53],
  [36, 43, 48, 55],
  [38, 45, 50, 54],
];

export const drone: SoundFactory = (ctx, env) => {
  const bus = busWithReverb(ctx, env.reverb, 0.6, 0.6);
  const master = gain(ctx, 1);
  const lp = filter(ctx, 'lowpass', 1100, 0.5);
  chain(bus.out, lp, master);
  const sweep = lfo(ctx, lp.frequency, 0.018, 380);
  const breath = noise(ctx, 'pink');
  const bf = filter(ctx, 'lowpass', 380);
  const bg = gain(ctx, 0.05);
  chain(breath.node, bf, bg, bus.input);
  const bm = lfo(ctx, bg.gain, 0.045, 0.035);
  const voices: Array<{ oscs: OscillatorNode[]; nodes: AudioNode[] }> = [];
  let k = 0;
  const state = { next: ctx.currentTime };
  const sched = new Scheduler(
    ctx,
    (from, to) => {
      if (state.next < from) state.next = from;
      while (state.next < to) {
        const t = state.next;
        const dur = rand(30, 40);
        const set = DRONE_SETS[k++ % DRONE_SETS.length]!;
        const g = gain(ctx, 0);
        g.connect(bus.input);
        const oscs: OscillatorNode[] = [];
        const nodes: AudioNode[] = [g];
        set.forEach((m, i) => {
          for (const det of [-4, 5]) {
            const o = ctx.createOscillator();
            o.type = i === 0 ? 'triangle' : 'sawtooth';
            o.frequency.value = midiToHz(m + (i === 0 ? 0 : 12));
            o.detune.value = det;
            const vg = gain(ctx, i === 0 ? 0.3 : 0.07);
            const p = panner(ctx, det < 0 ? -0.35 : 0.35);
            chain(o, vg, p, g);
            o.start(t);
            o.stop(t + dur + 14);
            oscs.push(o);
            nodes.push(vg, p);
          }
        });
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.4, t + 10);
        g.gain.setValueAtTime(0.4, t + dur);
        g.gain.linearRampToValueAtTime(0, t + dur + 12);
        const v = { oscs, nodes };
        voices.push(v);
        oscs[0]!.onended = () => {
          disconnectAll([...oscs, ...nodes]);
          const i = voices.indexOf(v);
          if (i >= 0) voices.splice(i, 1);
        };
        state.next += dur;
      }
    },
    env.horizon,
    3,
  );
  return {
    output: master,
    stop() {
      sched.stop();
      safeStop([sweep, bm, ...breath.sources, ...voices.flatMap((v) => v.oscs)]);
      disconnectAll([master, lp, bf, bg, ...bus.nodes, ...voices.flatMap((v) => v.nodes)]);
    },
  };
};

// ───────────────────────────────────────────────────────────── binaural beats

export function binaural(carrier: number, beat: number): SoundFactory {
  return (ctx) => {
    const out = gain(ctx, 1);
    const merger = ctx.createChannelMerger(2);
    const l = ctx.createOscillator();
    const r = ctx.createOscillator();
    l.frequency.value = carrier;
    r.frequency.value = carrier + beat;
    const lg = gain(ctx, 0.2);
    const rg = gain(ctx, 0.2);
    l.connect(lg).connect(merger, 0, 0);
    r.connect(rg).connect(merger, 0, 1);
    merger.connect(out);
    // a soft octave and a noise bed make long listening pleasant
    const oct = ctx.createOscillator();
    oct.frequency.value = carrier * 2;
    const og = gain(ctx, 0.025);
    oct.connect(og).connect(out);
    const n = noise(ctx, 'pink');
    const nf = filter(ctx, 'lowpass', 900, 0.5);
    const ng = gain(ctx, 0.12);
    chain(n.node, nf, ng, out);
    l.start();
    r.start();
    oct.start();
    return source(out, [l, r, oct, ...n.sources], [out, merger, lg, rg, og, nf, ng]);
  };
}
