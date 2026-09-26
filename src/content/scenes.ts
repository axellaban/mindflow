import type { Mix, Motif, PaletteId } from './types';

export type SceneId = 'lago' | 'lluvia' | 'oceano' | 'aurora' | 'fogata' | 'nieve' | 'desierto' | 'amanecer';

export type Particles = 'stars' | 'rain' | 'snow' | 'embers' | 'fireflies' | 'none';

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
