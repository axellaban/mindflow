import type { Mix, Motif, PaletteId } from './types';

export type SceneId =
  | 'playa'
  | 'playa-dia'
  | 'playa-ocaso'
  | 'playa-noche'
  | 'calma'
  | 'jardin'
  | 'lago'
  | 'lluvia'
  | 'oceano'
  | 'aurora'
  | 'fogata'
  | 'nieve'
  | 'desierto'
  | 'amanecer';

/** A home scene choice: a fixed scene, or the beach following the time of day. */
export type SceneChoice = SceneId | 'auto';

export type Particles = 'stars' | 'rain' | 'snow' | 'embers' | 'fireflies' | 'petals' | 'motes' | 'none';

export interface SceneDef {
  id: SceneId;
  name: string;
  palette: PaletteId;
  layout: 'lake' | 'forest' | 'ocean' | 'aurora' | 'campfire' | 'snow' | 'desert' | 'valley';
  particles: Particles[];
  sound: Mix;
  seed: number;
  /** Override the landscape drawn for this layout. */
  motif?: Motif;
}

export const SCENES: SceneDef[] = [
  {
    id: 'playa',
    name: 'Amanecer en la playa',
    palette: 'playa',
    layout: 'ocean',
    motif: 'beach',
    particles: ['none'],
    sound: { oceano: 0.8 },
    seed: 11,
  },
  {
    id: 'playa-dia',
    name: 'Mediodía en la playa',
    palette: 'playaDia',
    layout: 'ocean',
    motif: 'beach',
    particles: ['none'],
    sound: { oceano: 0.8, viento: 0.2 },
    seed: 11,
  },
  {
    id: 'playa-ocaso',
    name: 'Atardecer en la playa',
    palette: 'playaOcaso',
    layout: 'ocean',
    motif: 'beach',
    particles: ['none'],
    sound: { oceano: 0.8 },
    seed: 11,
  },
  {
    id: 'playa-noche',
    name: 'Noche en la playa',
    palette: 'playaNoche',
    layout: 'ocean',
    motif: 'beach',
    particles: ['stars'],
    sound: { oceano: 0.7, grillos: 0.15 },
    seed: 11,
  },
  {
    id: 'calma',
    name: 'Amanecer en el lago',
    palette: 'calma',
    layout: 'lake',
    particles: ['motes'],
    sound: { lago: 0.6, bosque: 0.45 },
    seed: 228,
  },
  {
    id: 'jardin',
    name: 'Atardecer rosa',
    palette: 'rose',
    layout: 'lake',
    particles: ['petals'],
    sound: { bosque: 0.5, lago: 0.45, campanillas: 0.12 },
    seed: 99,
  },
  {
    id: 'lago',
    name: 'Lago al anochecer',
    palette: 'dusk',
    layout: 'lake',
    particles: ['stars', 'fireflies'],
    sound: { lago: 0.75, grillos: 0.45 },
    seed: 11,
  },
  {
    id: 'lluvia',
    name: 'Bosque bajo la lluvia',
    palette: 'rain',
    layout: 'forest',
    particles: ['rain'],
    sound: { lluvia: 0.85, tormenta: 0.25 },
    seed: 22,
  },
  {
    id: 'oceano',
    name: 'Mar al atardecer',
    palette: 'sunset',
    layout: 'ocean',
    particles: ['none'],
    sound: { oceano: 0.9 },
    seed: 33,
  },
  {
    id: 'aurora',
    name: 'Aurora austral',
    palette: 'aurora',
    layout: 'aurora',
    particles: ['stars'],
    sound: { viento: 0.5, 'm-cristal': 0.35 },
    seed: 44,
  },
  {
    id: 'fogata',
    name: 'Fogata en la montaña',
    palette: 'ember',
    layout: 'campfire',
    particles: ['stars', 'embers'],
    sound: { fuego: 0.85, grillos: 0.3 },
    seed: 55,
  },
  {
    id: 'nieve',
    name: 'Nevada silenciosa',
    palette: 'snow',
    layout: 'snow',
    particles: ['snow'],
    sound: { viento: 0.55, campanillas: 0.2 },
    seed: 66,
  },
  {
    id: 'desierto',
    name: 'Cielo de Atacama',
    palette: 'desert',
    layout: 'desert',
    particles: ['stars'],
    sound: { viento: 0.4, 'm-drone': 0.35 },
    seed: 77,
  },
  {
    id: 'amanecer',
    name: 'Amanecer en el valle',
    palette: 'dawn',
    layout: 'valley',
    particles: ['none'],
    sound: { bosque: 0.8, arroyo: 0.45 },
    seed: 88,
  },
];

export const SCENE_BY_ID = Object.fromEntries(SCENES.map((s) => [s.id, s])) as Record<SceneId, SceneDef>;

export const AUTO_SCENE_NAME = 'Playa según la hora';

/** The beach as it looks right now: dawn, midday, sunset or a moonlit night. */
/**
 * The moonlit hours: the beach turns to night and the app wears its night palette.
 * index.html repeats these hours to paint the right colour before the app loads.
 */
export function isNightHour(d: Date = new Date()): boolean {
  const h = d.getHours();
  return h >= 20 || h < 5;
}

export function beachAt(d: Date = new Date()): SceneDef {
  const h = d.getHours();
  if (isNightHour(d)) return SCENE_BY_ID['playa-noche'];
  if (h < 9) return SCENE_BY_ID.playa;
  if (h < 17) return SCENE_BY_ID['playa-dia'];
  return SCENE_BY_ID['playa-ocaso'];
}

export function resolveScene(choice: SceneChoice | undefined, d: Date = new Date()): SceneDef {
  if (!choice || choice === 'auto') return beachAt(d);
  return SCENE_BY_ID[choice] ?? beachAt(d);
}
