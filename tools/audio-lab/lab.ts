/**
 * Offline loudness lab for the procedural generators.
 * Dev-only: open /tools/audio-lab/ with the Vite dev server.
 */
import { CALIBRATION, FACTORIES } from '../../src/audio/engine';
import { impulseResponse } from '../../src/audio/dsp';
import type { SourceId } from '../../src/content/types';

const SR = 44100;

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j]!, re[i]!];
      [im[i], im[j]] = [im[j]!, im[i]!];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k;
        const b = a + len / 2;
        const tr = re[b]! * cr - im[b]! * ci;
        const ti = re[b]! * ci + im[b]! * cr;
        re[b] = re[a]! - tr;
        im[b] = im[a]! - ti;
        re[a]! += tr;
        im[a]! += ti;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

function aWeight(f: number): number {
  const f2 = f * f;
  const ra = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
  return ra * 1.2589; // +2 dB normalisation at 1 kHz
}

function analyse(buf: AudioBuffer) {
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  const n = L.length;
  let sum = 0;
  let peak = 0;
  let nan = 0;
  const frame = 2048;
  let silent = 0;
  let frames = 0;
  for (let i = 0; i < n; i++) {
    const m = (L[i]! + R[i]!) / 2;
    if (!Number.isFinite(L[i]!) || !Number.isFinite(R[i]!)) nan++;
    sum += m * m;
    peak = Math.max(peak, Math.abs(L[i]!), Math.abs(R[i]!));
  }
  for (let i = 0; i + frame < n; i += frame) {
    let s = 0;
    for (let k = 0; k < frame; k++) s += L[i + k]! ** 2;
    frames++;
    if (Math.sqrt(s / frame) < 1e-4) silent++;
  }
  // A-weighted power + spectral balance
  const N = 4096;
  let wPow = 0;
  let bands = [0, 0, 0, 0];
  let count = 0;
  for (let i = SR * 2; i + N < n; i += N * 3) {
    const re = new Float64Array(N);
    const im = new Float64Array(N);
    for (let k = 0; k < N; k++) re[k] = ((L[i + k]! + R[i + k]!) / 2) * (0.5 - 0.5 * Math.cos((2 * Math.PI * k) / N));
    fft(re, im);
    for (let k = 1; k < N / 2; k++) {
      const f = (k * SR) / N;
      const p = (re[k]! ** 2 + im[k]! ** 2) / (N * N);
      wPow += p * aWeight(f) ** 2;
      const b = f < 250 ? 0 : f < 2000 ? 1 : f < 6000 ? 2 : 3;
      bands[b] += p;
    }
    count++;
  }
  const tot = bands.reduce((a, b) => a + b, 0) || 1;
  bands = bands.map((b) => Math.round((b / tot) * 100));
  const rms = Math.sqrt(sum / n);
  return {
    rmsDb: +(20 * Math.log10(rms + 1e-12)).toFixed(1),
    loudDb: +(10 * Math.log10(wPow / Math.max(1, count) + 1e-20) + 3).toFixed(1),
    peak: +peak.toFixed(3),
    silentPct: Math.round((silent / Math.max(1, frames)) * 100),
    nan,
    bands, // % energy: <250 Hz, 250–2k, 2k–6k, >6k
  };
}

async function renderSource(id: SourceId, seconds: number) {
  const ctx = new OfflineAudioContext(2, SR * seconds, SR);
  const reverbIn = ctx.createGain();
  reverbIn.gain.value = 0.5;
  const conv = ctx.createConvolver();
  conv.buffer = impulseResponse(ctx);
  const rOut = ctx.createGain();
  rOut.gain.value = 0.9;
  reverbIn.connect(conv).connect(rOut).connect(ctx.destination);
  const t0 = performance.now();
  const src = FACTORIES[id](ctx, { reverb: reverbIn, horizon: seconds });
  const g = ctx.createGain();
  g.gain.value = CALIBRATION[id];
  src.output.connect(g).connect(ctx.destination);
  const buf = await ctx.startRendering();
  const ms = performance.now() - t0;
  return { id, ms: Math.round(ms), ...analyse(buf) };
}

async function run() {
  const out = document.getElementById('out')!;
  const only = new URLSearchParams(location.search).get('ids');
  const seconds = Number(new URLSearchParams(location.search).get('s') ?? 20);
  const ids = (only ? only.split(',') : Object.keys(FACTORIES)) as SourceId[];
  const results = [];
  for (const id of ids) {
    try {
      const r = await renderSource(id, seconds);
      results.push(r);
      out.textContent = results.map((x) => JSON.stringify(x)).join('\n');
    } catch (e) {
      results.push({ id, error: String(e) });
    }
  }
  (window as unknown as { __results: unknown }).__results = results;
}

void run();
