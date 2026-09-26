import type { BellId } from '@/store/app';
import type { Mix, SourceId } from '@/content/types';
import { BreathTone, ringBell } from './bells';
import { type SoundFactory, type SoundSource, type SynthEnv, gain, impulseResponse } from './dsp';
import { coloredNoise, fan, fire, purr, train } from './generators/home';
import { binaural, bowls, crystal, drone, kalimba, pads, piano } from './generators/music';
import { birds, chimes, crickets, lake, ocean, rain, roofRain, stream, thunder, wind } from './generators/nature';

/**
 * Per-source calibration so that every layer at level 1.0 sits at a similar
 * perceived loudness. Tuned with offline RMS measurements (see tools/audio-calibrate).
 */
export const CALIBRATION: Record<SourceId, number> = {
  lluvia: 0.73,
  'lluvia-techo': 0.28,
  tormenta: 0.9,
  oceano: 0.78,
  lago: 2.09,
  arroyo: 0.64,
  viento: 0.9,
  bosque: 1.72,
  grillos: 1.13,
  fuego: 1.27,
  tren: 0.9,
  ventilador: 0.7,
  ronroneo: 0.97,
  campanillas: 1.01,
  'ruido-blanco': 0.28,
  'ruido-rosa': 0.53,
  'ruido-marron': 0.64,
  'm-horizonte': 1.05,
  'm-piano': 0.78,
  'm-kalimba': 0.67,
  'm-cuencos': 1.35,
  'm-cristal': 2.6,
  'm-drone': 1.69,
  'b-alfa': 0.7,
  'b-theta': 0.7,
  'b-delta': 0.7,
};

export const FACTORIES: Record<SourceId, SoundFactory> = {
  lluvia: rain,
  'lluvia-techo': roofRain,
  tormenta: thunder,
  oceano: ocean,
  lago: lake,
  arroyo: stream,
  viento: wind,
  bosque: birds,
  grillos: crickets,
  fuego: fire,
  tren: train,
  ventilador: fan,
  ronroneo: purr,
  campanillas: chimes,
  'ruido-blanco': coloredNoise('white'),
  'ruido-rosa': coloredNoise('pink'),
  'ruido-marron': coloredNoise('brown'),
  'm-horizonte': pads,
  'm-piano': piano,
  'm-kalimba': kalimba,
  'm-cuencos': bowls,
  'm-cristal': crystal,
  'm-drone': drone,
  'b-alfa': binaural(200, 10),
  'b-theta': binaural(180, 6),
  'b-delta': binaural(150, 2),
};

interface Layer {
  id: SourceId;
  source: SoundSource;
  gain: GainNode;
  level: number;
  stopTimer?: ReturnType<typeof setTimeout>;
}

const SILENT_WAV = (() => {
  // 0.5 s of 8 kHz, 8-bit mono silence
  const n = 4000;
  const bytes = new Uint8Array(44 + n);
  const view = new DataView(bytes.buffer);
  const w = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  view.setUint32(4, 36 + n, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  w(36, 'data');
  view.setUint32(40, n, true);
  bytes.fill(128, 44);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(bin)}`;
})();

type Listener = () => void;

class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private layersBus!: GainNode;
  private sfxBus!: GainNode;
  private reverbIn!: GainNode;
  private layers = new Map<SourceId, Layer>();
  private keepAlive: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();

  /** Must be called from a user gesture at least once (autoplay policies). */
  ensure(): AudioContext {
    if (this.ctx) return this.ctx;
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor({ latencyHint: 'playback' });
    this.ctx = ctx;
    this.master = gain(ctx, 1);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 10;
    comp.ratio.value = 6;
    comp.attack.value = 0.005;
    comp.release.value = 0.3;
    this.master.connect(comp).connect(ctx.destination);
    this.layersBus = gain(ctx, 1);
    this.layersBus.connect(this.master);
    this.sfxBus = gain(ctx, 1);
    this.sfxBus.connect(this.master);
    const convolver = ctx.createConvolver();
    convolver.buffer = impulseResponse(ctx);
    this.reverbIn = gain(ctx, 0.5);
    const reverbOut = gain(ctx, 0.9);
    this.reverbIn.connect(convolver).connect(reverbOut).connect(this.layersBus);

    const resume = () => {
      if (ctx.state !== 'running' && (this.layers.size > 0 || !this.keepAlive?.paused)) void ctx.resume().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    ctx.addEventListener('statechange', () => this.emit());
    try {
      const nav = navigator as Navigator & { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'playback';
    } catch {
      /* not supported */
    }
    return ctx;
  }

  /**
   * Resume audio from a user gesture. With `keepAlive`, a silent looping media
   * element holds the audio session (iOS silent switch, lock screen, background).
   * Narrated sessions skip it: the narration element already plays that role.
   */
  unlock(keepAlive = true): void {
    const ctx = this.ensure();
    if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
    if (!keepAlive) {
      this.keepAlive?.pause();
      return;
    }
    if (!this.keepAlive) {
      this.keepAlive = new Audio(SILENT_WAV);
      this.keepAlive.loop = true;
      this.keepAlive.setAttribute('playsinline', '');
      this.keepAlive.preload = 'auto';
    }
    if (this.keepAlive.paused) void this.keepAlive.play().catch(() => undefined);
  }

  releaseKeepAlive(): void {
    this.keepAlive?.pause();
  }

  get env(): SynthEnv {
    return { reverb: this.reverbIn, horizon: 0 };
  }

  /**
   * Declarative mixing: fades in new layers, re-levels existing ones and fades
   * out whatever is not in `mix`.
   */
  setMix(mix: Mix, fade = 1.6): void {
    const ctx = this.ensure();
    const t = ctx.currentTime;
    const wanted = new Set(Object.keys(mix) as SourceId[]);
    for (const [id, layer] of this.layers) {
      if (!wanted.has(id) || (mix[id] ?? 0) <= 0) this.removeLayer(layer, fade);
    }
    for (const id of wanted) {
      const level = mix[id] ?? 0;
      if (level <= 0) continue;
      const target = level * CALIBRATION[id];
      const existing = this.layers.get(id);
      if (existing) {
        if (existing.stopTimer) {
          clearTimeout(existing.stopTimer);
          existing.stopTimer = undefined;
        }
        existing.level = level;
        existing.gain.gain.cancelScheduledValues(t);
        existing.gain.gain.setValueAtTime(existing.gain.gain.value, t);
        existing.gain.gain.linearRampToValueAtTime(target, t + Math.max(0.05, fade * 0.5));
        continue;
      }
      let source: SoundSource;
      try {
        source = FACTORIES[id](ctx, { reverb: this.reverbIn, horizon: 0 });
      } catch (err) {
        console.warn('No se pudo crear la capa', id, err);
        continue;
      }
      const g = gain(ctx, 0);
      source.output.connect(g).connect(this.layersBus);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(target, t + fade);
      this.layers.set(id, { id, source, gain: g, level });
    }
    this.emit();
  }

  private removeLayer(layer: Layer, fade: number): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    if (layer.stopTimer) return;
    layer.gain.gain.cancelScheduledValues(t);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, t);
    layer.gain.gain.linearRampToValueAtTime(0, t + fade);
    layer.stopTimer = setTimeout(
      () => {
        layer.source.stop();
        layer.gain.disconnect();
        if (this.layers.get(layer.id) === layer) this.layers.delete(layer.id);
        this.emit();
      },
      fade * 1000 + 150,
    );
  }

  /** Volume of all procedural layers (the "background" slider). */
  setLayersVolume(v: number, ramp = 0.4): void {
    const ctx = this.ensure();
    const t = ctx.currentTime;
    this.layersBus.gain.cancelScheduledValues(t);
    this.layersBus.gain.setValueAtTime(this.layersBus.gain.value, t);
    this.layersBus.gain.linearRampToValueAtTime(Math.max(0, v), t + ramp);
  }

  /** Master fade (sleep timer). */
  fadeMaster(to: number, seconds: number): void {
    const ctx = this.ensure();
    const t = ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(to, t + seconds);
  }

  stopAll(fade = 1.2): void {
    if (!this.ctx) return;
    this.setMix({}, fade);
  }

  activeMix(): Mix {
    const m: Mix = {};
    for (const [id, l] of this.layers) if (!l.stopTimer) m[id] = l.level;
    return m;
  }

  bell(kind: BellId, amp = 0.55, when = 0): number {
    const ctx = this.ensure();
    return ringBell(ctx, this.sfxBus, kind, ctx.currentTime + when, amp);
  }

  breathTone(): BreathTone {
    const ctx = this.ensure();
    return new BreathTone(ctx, this.sfxBus);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  get running(): boolean {
    return this.ctx?.state === 'running';
  }
}

export const engine = new AudioEngine();
