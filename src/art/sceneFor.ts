import type { Particles, SceneDef } from '@/content/scenes';
import type { ArtSpec, Motif } from '@/content/types';
import { PALETTES } from './palettes';

const LAYOUT: Partial<Record<Motif, SceneDef['layout']>> = {
  lake: 'lake',
  waves: 'ocean',
  lighthouse: 'ocean',
  forest: 'forest',
  path: 'forest',
  bamboo: 'forest',
  flame: 'campfire',
  cabin: 'snow',
  dunes: 'desert',
  aurora: 'aurora',
};

/** Builds an animated scene from any cover artwork (used behind the player). */
export function sceneForArt(art: ArtSpec): SceneDef {
  const p = PALETTES[art.palette];
  const particles: Particles[] = [];
  if (p.night || art.motif === 'stars' || art.motif === 'moon') particles.push('stars');
  if (art.motif === 'rain' || art.motif === 'window' || art.palette === 'rain') particles.push('rain');
  if (art.palette === 'snow') particles.push('snow');
  if (art.motif === 'flame') particles.push('embers');
  if (art.motif === 'lake' && p.night) particles.push('fireflies');
  return {
    id: 'lago',
    name: '',
    palette: art.palette,
    layout: LAYOUT[art.motif] ?? 'valley',
    particles: particles.length ? particles : ['none'],
    sound: {},
    seed: art.seed,
    motif: art.motif,
  };
}
