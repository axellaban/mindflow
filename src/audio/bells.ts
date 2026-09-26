import type { BellId } from '@/store/app';
import { type Ctx, chain, disconnectAll, filter, gain, midiToHz, noiseBuffer, panner } from './dsp';
import { strikeBowl } from './generators/music';

/** One-shot bells for the timer and session cues. */
export function ringBell(ctx: Ctx, dest: AudioNode, kind: BellId, t = ctx.currentTime, amp = 0.5): number {
  switch (kind) {
    case 'cuenco':
      strikeBowl(ctx, dest, t, midiToHz(50), amp * 0.9, 0);
      return 9;
    case 'campana':
      templeBell(ctx, dest, t, amp);
      return 8;
    case 'gong':
      gong(ctx, dest, t, amp);
      return 11;
    case 'madera':
      woodBlock(ctx, dest, t, amp);
      return 1;
  }
}

function templeBell(ctx: Ctx, dest: AudioNode, t: number, amp: number): void {
  const f0 = 523.25;
  const partials: Array<[number, number, number]> = [
    [0.5, 0.5, 7],
    [1, 1, 5],
    [1.19, 0.45, 3.5],
    [1.5, 0.35, 2.5],
    [2, 0.3, 2],
    [2.52, 0.18, 1.3],
    [3.01, 0.12, 0.9],
  ];
  const p = panner(ctx, 0);
  p.connect(dest);
  const all: AudioNode[] = [p];
  let first: OscillatorNode | null = null;
  for (const [r, a, decay] of partials) {
    const o = ctx.createOscillator();
    o.frequency.value = f0 * r;
    const g = gain(ctx, 0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(amp * a * 0.28, t + 0.004);
    g.gain.setTargetAtTime(0, t + 0.006, decay / 4);
    o.connect(g).connect(p);
    o.start(t);
    o.stop(t + decay * 1.6);
    all.push(o, g);
    first ??= o;
  }
  if (first) first.onended = () => disconnectAll(all);
}

function gong(ctx: Ctx, dest: AudioNode, t: number, amp: number): void {
  const f0 = 92;
  const ratios = [1, 1.52, 2.03, 2.61, 3.14, 3.78, 4.45, 5.27, 6.1, 7.2];
  const p = panner(ctx, 0);
  p.connect(dest);
  const all: AudioNode[] = [p];
  let first: OscillatorNode | null = null;
  for (const [i, r] of ratios.entries()) {
    const o = ctx.createOscillator();
    o.frequency.value = f0 * r * (1 + (Math.random() - 0.5) * 0.004);
    const g = gain(ctx, 0);
    const a = amp * 0.22 * Math.pow(0.8, i);
    // higher partials bloom slightly later: the characteristic gong swell
    const bloom = 0.02 + i * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(a * (i === 0 ? 1 : 0.4), t + 0.01);
    g.gain.linearRampToValueAtTime(a, t + bloom);
    g.gain.setTargetAtTime(0, t + bloom, (9 - i * 0.6) / 4);
    o.connect(g).connect(p);
    o.start(t);
    o.stop(t + 12);
    all.push(o, g);
    first ??= o;
  }
  if (first) first.onended = () => disconnectAll(all);
}

function woodBlock(ctx: Ctx, dest: AudioNode, t: number, amp: number): void {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, 'white');
  const bp = filter(ctx, 'bandpass', 820, 9);
  const g = gain(ctx, 0);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(amp * 2.4, t + 0.002);
  g.gain.setTargetAtTime(0, t + 0.004, 0.028);
  const o = ctx.createOscillator();
  o.frequency.value = 820;
  const og = gain(ctx, 0);
  og.gain.setValueAtTime(0, t);
  og.gain.linearRampToValueAtTime(amp * 0.35, t + 0.002);
  og.gain.setTargetAtTime(0, t + 0.004, 0.035);
  chain(src, bp, g, dest);
  o.connect(og).connect(dest);
  src.start(t, Math.random() * 4);
  src.stop(t + 0.4);
  o.start(t);
  o.stop(t + 0.4);
  src.onended = () => disconnectAll([src, bp, g, o, og]);
}

/**
 * Continuous breathing tone: a warm voice that swells and brightens on the
 * inhale and softens on the exhale, so the ear can follow the rhythm.
 */
export class BreathTone {
  private oscs: OscillatorNode[] = [];
  private out: GainNode;
  private lp: BiquadFilterNode;
  private base = midiToHz(57);

  constructor(
    private ctx: Ctx,
    dest: AudioNode,
  ) {
    this.out = gain(ctx, 0);
    this.lp = filter(ctx, 'lowpass', 500, 0.6);
    chain(this.lp, this.out, dest);
    const voices: Array<[number, OscillatorType, number, number]> = [
      [1, 'sine', 0.55, -0.3],
      [1.5, 'sine', 0.22, 0.3],
      [2, 'triangle', 0.12, 0],
      [0.5, 'sine', 0.3, 0],
    ];
    for (const [ratio, type, a, pan] of voices) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = this.base * ratio;
      const g = gain(ctx, a);
      chain(o, g, panner(ctx, pan), this.lp);
      o.start();
      this.oscs.push(o);
    }
  }

  phase(kind: 'in' | 'in2' | 'hold' | 'out' | 'rest', seconds: number, t = this.ctx.currentTime): void {
    const g = this.out.gain;
    const f = this.lp.frequency;
    const tau = Math.max(0.2, seconds / 3);
    const glide = (ratio: number) =>
      this.oscs.forEach((o, i) => {
        const base = [1, 1.5, 2, 0.5][i]! * this.base;
        o.frequency.setTargetAtTime(base * ratio, t, tau);
      });
    if (kind === 'in' || kind === 'in2') {
      g.setTargetAtTime(kind === 'in2' ? 0.2 : 0.17, t, tau);
      f.setTargetAtTime(kind === 'in2' ? 2100 : 1700, t, tau);
      glide(kind === 'in2' ? 1.19 : 1.122);
    } else if (kind === 'hold') {
      g.setTargetAtTime(0.1, t, 0.6);
      f.setTargetAtTime(1100, t, 0.8);
    } else if (kind === 'out') {
      g.setTargetAtTime(0.03, t, tau);
      f.setTargetAtTime(380, t, tau);
      glide(1);
    } else {
      g.setTargetAtTime(0.02, t, 0.5);
      f.setTargetAtTime(420, t, 0.6);
    }
  }

  dispose(): void {
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(0, t, 0.25);
    const oscs = this.oscs;
    setTimeout(() => {
      for (const o of oscs) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
        o.disconnect();
      }
      this.lp.disconnect();
      this.out.disconnect();
    }, 1500);
  }
}
