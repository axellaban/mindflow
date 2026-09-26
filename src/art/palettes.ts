import type { PaletteId } from '@/content/types';

export interface Palette {
  /** top → middle → horizon */
  sky: [string, string, string];
  /** far → near */
  layers: [string, string, string, string];
  celestial: string;
  glow: string;
  night: boolean;
  water: string;
  accent: [string, string, string];
  /** Tint used by the UI around this artwork (buttons, progress, glows). */
  ui: string;
}

export const PALETTES: Record<PaletteId, Palette> = {
  dusk: {
    sky: ['#1a1740', '#6b4b8e', '#f2a58e'],
    layers: ['#a8708f', '#795584', '#4d3a6b', '#281f47'],
    celestial: '#ffe8cc',
    glow: '#ffb99a',
    night: true,
    water: '#2e2553',
    accent: ['#ffcfb0', '#e59ab8', '#a88bd8'],
    ui: '#f6b7a4',
  },
  night: {
    sky: ['#0a0614', '#1c1236', '#3a2862'],
    layers: ['#3f2d6e', '#2d2156', '#1e163d', '#120d27'],
    celestial: '#f7f1ff',
    glow: '#b9a2ff',
    night: true,
    water: '#1b1338',
    accent: ['#d9c9ff', '#b9a2ff', '#8f7ce0'],
    ui: '#cbb9ff',
  },
  dawn: {
    sky: ['#2a2c66', '#9c7ab5', '#ffcfae'],
    layers: ['#d6a4b4', '#a67fa6', '#735f8f', '#453e6b'],
    celestial: '#fff3da',
    glow: '#ffc8a2',
    night: false,
    water: '#6f5d95',
    accent: ['#ffd9bd', '#f3aac0', '#b79be0'],
    ui: '#ffc6a8',
  },
  ocean: {
    sky: ['#0b2a45', '#23628a', '#8fd0cf'],
    layers: ['#3a8aa3', '#256f8c', '#185673', '#0e3d57'],
    celestial: '#fff7e2',
    glow: '#c9f1ea',
    night: false,
    water: '#1b5f80',
    accent: ['#bdf1ea', '#7fd4dd', '#4aa6c6'],
    ui: '#8fe0dc',
  },
  sunset: {
    sky: ['#2b1b4a', '#b24f73', '#ffb26b'],
    layers: ['#c46a73', '#92486a', '#62305a', '#3a1c40'],
    celestial: '#ffeabd',
    glow: '#ff9c6b',
    night: false,
    water: '#6e2f58',
    accent: ['#ffd29a', '#ff9f80', '#d9689a'],
    ui: '#ffb08a',
  },
  forest: {
    sky: ['#0d2227', '#23524f', '#8cc2a6'],
    layers: ['#5e9a86', '#3e7768', '#28594f', '#163b36'],
    celestial: '#effae9',
    glow: '#c7ecd3',
    night: false,
    water: '#2a5c55',
    accent: ['#d2f2c9', '#9fd8b4', '#6fb59a'],
    ui: '#a6e3c4',
  },
  rain: {
    sky: ['#101c2d', '#2c4259', '#7891a4'],
    layers: ['#58708a', '#415a73', '#2e445a', '#1c2d3f'],
    celestial: '#e1eaf2',
    glow: '#aac3d8',
    night: false,
    water: '#2f465c',
    accent: ['#cfe0ee', '#9fb8cc', '#ffd9a3'],
    ui: '#b8cde0',
  },
  aurora: {
    sky: ['#020b14', '#082336', '#0f3a52'],
    layers: ['#1a4660', '#11334a', '#0a2334', '#051521'],
    celestial: '#e8fbff',
    glow: '#6fe3c6',
    night: true,
    water: '#0a2436',
    accent: ['#5cf2b4', '#63c9ff', '#b58cff'],
    ui: '#7ff0cf',
  },
  ember: {
    sky: ['#0a0918', '#26163a', '#5a2a3c'],
    layers: ['#4e2639', '#381b2f', '#251322', '#140b15'],
    celestial: '#ffdcae',
    glow: '#ff8a45',
    night: true,
    water: '#2a1528',
    accent: ['#ffd27a', '#ff9a45', '#ff6a3a'],
    ui: '#ffb27a',
  },
  snow: {
    sky: ['#2a3a5f', '#7f97bf', '#dae6f5'],
    layers: ['#c9d6ea', '#a9bcd9', '#859dc4', '#5f79a6'],
    celestial: '#ffffff',
    glow: '#eaf1ff',
    night: false,
    water: '#8ea4c8',
    accent: ['#ffffff', '#dbe7ff', '#ffd6a3'],
    ui: '#d6e4ff',
  },
  desert: {
    sky: ['#070720', '#241b47', '#7b4a6b'],
    layers: ['#7d4553', '#5e3543', '#432735', '#291825'],
    celestial: '#ffeccf',
    glow: '#ffb98f',
    night: true,
    water: '#2e1d3c',
    accent: ['#ffe3c4', '#d9a6d6', '#8f9bff'],
    ui: '#f2b9a6',
  },
  lavender: {
    sky: ['#2d2a5f', '#7d6fbb', '#e3d3f7'],
    layers: ['#b3a2da', '#8e7fc4', '#6a5ea6', '#473f82'],
    celestial: '#fff8ff',
    glow: '#efe0ff',
    night: false,
    water: '#6e62a8',
    accent: ['#f6e8ff', '#cdb8f5', '#9f8fe0'],
    ui: '#d7c6ff',
  },
  mist: {
    sky: ['#34465c', '#8ea4b8', '#e8eae4'],
    layers: ['#b9c6cf', '#93a6b5', '#6d8499', '#4a627a'],
    celestial: '#fffdf4',
    glow: '#f6ecd6',
    night: false,
    water: '#8397aa',
    accent: ['#fff6e3', '#d7e2ea', '#a9bccb'],
    ui: '#dfe8ef',
  },
  gold: {
    sky: ['#3a2a4f', '#d68a5c', '#ffdca4'],
    layers: ['#d88c63', '#ad6752', '#7e4b45', '#4f2f37'],
    celestial: '#fff6da',
    glow: '#ffcb7c',
    night: false,
    water: '#8e5a50',
    accent: ['#ffe8b3', '#ffc07a', '#f29a6b'],
    ui: '#ffd08f',
  },
  teal: {
    sky: ['#0a2932', '#1d6a73', '#a3e3d8'],
    layers: ['#58b0aa', '#3a8f8d', '#266f72', '#154d55'],
    celestial: '#f4fffb',
    glow: '#c9f4ea',
    night: false,
    water: '#237078',
    accent: ['#d9fff5', '#9fe6d8', '#5fc2b8'],
    ui: '#9eeadb',
  },
  plum: {
    sky: ['#170d2e', '#4e2a6d', '#b0709f'],
    layers: ['#8e5690', '#6b3f78', '#4a2b5e', '#2c1a40'],
    celestial: '#ffe5f3',
    glow: '#f0a6d0',
    night: true,
    water: '#3e2459',
    accent: ['#ffd2ea', '#e39ad0', '#a883e6'],
    ui: '#f0b3d8',
  },
  rose: {
    sky: ['#3b1f3f', '#c27a98', '#ffd3cf'],
    layers: ['#e6a9b8', '#c98aa3', '#9c6a8c', '#6a4a6e'],
    celestial: '#ffe4cc',
    glow: '#ffbcaa',
    night: false,
    water: '#a56f8e',
    accent: ['#ffe1e6', '#f7b7c8', '#d99bc8'],
    ui: '#f7bccb',
  },
  sage: {
    sky: ['#233a36', '#7fa092', '#e9eedd'],
    layers: ['#a9c2b0', '#86a592', '#638673', '#435f52'],
    celestial: '#fff1cf',
    glow: '#f6e9c4',
    night: false,
    water: '#7c9c8d',
    accent: ['#f4f7e8', '#cfe2d5', '#a8c5b2'],
    ui: '#cfe2d5',
  },
};

export function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p: number, s: number) => (p >> s) & 255;
  const m = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
  return `#${((1 << 24) | (m(16) << 16) | (m(8) << 8) | m(0)).toString(16).slice(1)}`;
}

export function rgba(hex: string, alpha: number): string {
  const p = parseInt(hex.slice(1), 16);
  return `rgba(${(p >> 16) & 255}, ${(p >> 8) & 255}, ${p & 255}, ${alpha})`;
}
