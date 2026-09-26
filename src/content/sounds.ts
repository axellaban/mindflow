import type { ArtSpec, BedId, Mix, MusicId, SoundId, SourceId } from './types';

export interface SoundDef {
  id: SoundId;
  name: string;
  icon: string; // lucide icon name, resolved in the UI
  group: 'agua' | 'naturaleza' | 'hogar' | 'ruido';
  hint: string;
}

export const SOUNDS: SoundDef[] = [
  { id: 'lluvia', name: 'Lluvia', icon: 'CloudRain', group: 'agua', hint: 'Lluvia constante sobre el bosque' },
  { id: 'lluvia-techo', name: 'Lluvia en el techo', icon: 'House', group: 'agua', hint: 'Gotas sobre un techo de chapa' },
  { id: 'tormenta', name: 'Truenos', icon: 'CloudLightning', group: 'agua', hint: 'Truenos lejanos cada tanto' },
  { id: 'oceano', name: 'Olas', icon: 'Waves', group: 'agua', hint: 'El mar que va y viene' },
  { id: 'lago', name: 'Lago', icon: 'Droplets', group: 'agua', hint: 'Agua quieta en la orilla' },
  { id: 'arroyo', name: 'Arroyo', icon: 'Droplet', group: 'agua', hint: 'Agua que corre entre piedras' },
  { id: 'viento', name: 'Viento', icon: 'Wind', group: 'naturaleza', hint: 'Ráfagas suaves en la montaña' },
  { id: 'bosque', name: 'Pájaros', icon: 'Bird', group: 'naturaleza', hint: 'Un bosque que despierta' },
  { id: 'grillos', name: 'Grillos', icon: 'Moon', group: 'naturaleza', hint: 'Noche de verano' },
  { id: 'fuego', name: 'Fuego', icon: 'Flame', group: 'hogar', hint: 'Leña que crepita' },
  { id: 'tren', name: 'Tren', icon: 'TrainFront', group: 'hogar', hint: 'Traqueteo nocturno' },
  { id: 'ventilador', name: 'Ventilador', icon: 'Fan', group: 'hogar', hint: 'Un zumbido constante para dormir' },
  { id: 'ronroneo', name: 'Ronroneo', icon: 'Cat', group: 'hogar', hint: 'Un gato que duerme a tu lado' },
  { id: 'campanillas', name: 'Campanillas', icon: 'Bell', group: 'naturaleza', hint: 'Carillón de viento' },
  { id: 'ruido-blanco', name: 'Ruido blanco', icon: 'AudioWaveform', group: 'ruido', hint: 'Enmascara ruidos agudos' },
  { id: 'ruido-rosa', name: 'Ruido rosa', icon: 'AudioLines', group: 'ruido', hint: 'Más suave y equilibrado' },
  { id: 'ruido-marron', name: 'Ruido marrón', icon: 'Activity', group: 'ruido', hint: 'Grave y profundo, ideal para enfocarse' },
];

export const SOUND_BY_ID = Object.fromEntries(SOUNDS.map((s) => [s.id, s])) as Record<SoundId, SoundDef>;

export interface MusicDef {
  id: MusicId;
  title: string;
  subtitle: string;
  description: string;
  kind: 'ambient' | 'binaural';
  mood: 'relajar' | 'enfocar' | 'dormir';
  art: ArtSpec;
  headphones?: boolean;
}

export const MUSIC: MusicDef[] = [
  {
    id: 'm-horizonte',
    title: 'Horizonte',
    subtitle: 'Pads ambientales',
    description: 'Acordes amplios que se transforman lentamente, como la luz sobre el horizonte.',
    kind: 'ambient',
    mood: 'relajar',
    art: { palette: 'dusk', motif: 'mountains', seed: 701 },
  },
  {
    id: 'm-piano',
    title: 'Piano en calma',
    subtitle: 'Piano generativo',
    description: 'Notas de piano que nunca se repiten igual, inspiradas en la música ambiental clásica.',
    kind: 'ambient',
    mood: 'relajar',
    art: { palette: 'rain', motif: 'window', seed: 702 },
  },
  {
    id: 'm-kalimba',
    title: 'Kalimba nocturna',
    subtitle: 'Melodías de cristal',
    description: 'Una kalimba suave que dibuja melodías lentas en una escala pentatónica.',
    kind: 'ambient',
    mood: 'dormir',
    art: { palette: 'lavender', motif: 'stars', seed: 703 },
  },
  {
    id: 'm-cuencos',
    title: 'Cuencos tibetanos',
    subtitle: 'Resonancia profunda',
    description: 'Cuencos que resuenan y se desvanecen lentamente. Ideal para meditar en silencio.',
    kind: 'ambient',
    mood: 'relajar',
    art: { palette: 'gold', motif: 'orb', seed: 704 },
  },
  {
    id: 'm-cristal',
    title: 'Lluvia de cristal',
    subtitle: 'Campanas y celesta',
    description: 'Destellos brillantes y delicados, como gotas de luz cayendo sobre el agua.',
    kind: 'ambient',
    mood: 'enfocar',
    art: { palette: 'aurora', motif: 'aurora', seed: 705 },
  },
  {
    id: 'm-drone',
    title: 'Profundidad',
    subtitle: 'Drones para dormir',
    description: 'Tonos graves y envolventes que se mueven muy despacio. Pensado para el sueño profundo.',
    kind: 'ambient',
    mood: 'dormir',
    art: { palette: 'night', motif: 'waves', seed: 706 },
  },
  {
    id: 'b-alfa',
    title: 'Ondas alfa',
    subtitle: '10 Hz · enfoque relajado',
    description: 'Pulsos binaurales en la frecuencia alfa, asociada a la atención relajada. Usa auriculares.',
    kind: 'binaural',
    mood: 'enfocar',
    art: { palette: 'ocean', motif: 'orb', seed: 707 },
    headphones: true,
  },
  {
    id: 'b-theta',
    title: 'Ondas theta',
    subtitle: '6 Hz · meditación profunda',
    description: 'Pulsos binaurales en la frecuencia theta, asociada a estados meditativos. Usa auriculares.',
    kind: 'binaural',
    mood: 'relajar',
    art: { palette: 'plum', motif: 'orb', seed: 708 },
    headphones: true,
  },
  {
    id: 'b-delta',
    title: 'Ondas delta',
    subtitle: '2 Hz · sueño profundo',
    description: 'Pulsos binaurales en la frecuencia delta, asociada al sueño profundo. Usa auriculares.',
    kind: 'binaural',
    mood: 'dormir',
    art: { palette: 'night', motif: 'orb', seed: 709 },
    headphones: true,
  },
];

export const MUSIC_BY_ID = Object.fromEntries(MUSIC.map((m) => [m.id, m])) as Record<MusicId, MusicDef>;

export interface BedDef {
  id: BedId;
  name: string;
  mix: Mix;
}

export const BEDS: BedDef[] = [
  { id: 'none', name: 'Silencio', mix: {} },
  { id: 'pad', name: 'Música suave', mix: { 'm-horizonte': 1 } },
  { id: 'piano', name: 'Piano', mix: { 'm-piano': 1 } },
  { id: 'cuencos', name: 'Cuencos', mix: { 'm-cuencos': 0.9 } },
  { id: 'lluvia', name: 'Lluvia', mix: { lluvia: 1 } },
  { id: 'oceano', name: 'Olas', mix: { oceano: 1 } },
  { id: 'bosque', name: 'Bosque', mix: { bosque: 0.8, arroyo: 0.35 } },
  { id: 'arroyo', name: 'Arroyo', mix: { arroyo: 0.9, bosque: 0.25 } },
  { id: 'noche', name: 'Noche de verano', mix: { grillos: 0.75, lago: 0.4 } },
  { id: 'fuego', name: 'Fuego', mix: { fuego: 1 } },
  { id: 'viento', name: 'Viento', mix: { viento: 0.75, campanillas: 0.25 } },
  { id: 'tren', name: 'Tren nocturno', mix: { tren: 0.9, viento: 0.15 } },
  { id: 'biblioteca', name: 'Lluvia y chimenea', mix: { lluvia: 0.85, fuego: 0.3, ronroneo: 0.25 } },
  { id: 'cabana', name: 'Chimenea en invierno', mix: { fuego: 0.9, viento: 0.35 } },
  { id: 'faro', name: 'Mar de noche', mix: { oceano: 0.9, viento: 0.2 } },
  { id: 'desierto', name: 'Viento del desierto', mix: { viento: 0.55, 'm-drone': 0.45 } },
];

export const BED_BY_ID = Object.fromEntries(BEDS.map((b) => [b.id, b])) as Record<BedId, BedDef>;

/** Beds offered in the player picker (story-specific ones appear only when they are the default). */
export const PICKER_BEDS: BedId[] = ['none', 'pad', 'piano', 'cuencos', 'lluvia', 'oceano', 'bosque', 'fuego', 'noche', 'viento'];

export interface MixPreset {
  id: string;
  name: string;
  mix: Mix;
  art: ArtSpec;
}

export const MIX_PRESETS: MixPreset[] = [
  {
    id: 'tormenta-bosque',
    name: 'Tormenta en el bosque',
    mix: { lluvia: 0.8, tormenta: 0.6, viento: 0.3 },
    art: { palette: 'rain', motif: 'forest', seed: 801 },
  },
  {
    id: 'cabana-lluvia',
    name: 'Cabaña con lluvia',
    mix: { 'lluvia-techo': 0.7, fuego: 0.55 },
    art: { palette: 'ember', motif: 'cabin', seed: 802 },
  },
  {
    id: 'playa-noche',
    name: 'Playa de noche',
    mix: { oceano: 0.85, viento: 0.2, grillos: 0.2 },
    art: { palette: 'ocean', motif: 'waves', seed: 803 },
  },
  {
    id: 'amanecer-bosque',
    name: 'Amanecer en el bosque',
    mix: { bosque: 0.8, arroyo: 0.5, viento: 0.15 },
    art: { palette: 'dawn', motif: 'forest', seed: 804 },
  },
  {
    id: 'noche-lago',
    name: 'Noche junto al lago',
    mix: { lago: 0.7, grillos: 0.6, fuego: 0.25 },
    art: { palette: 'dusk', motif: 'lake', seed: 805 },
  },
  {
    id: 'enfoque-marron',
    name: 'Enfoque profundo',
    mix: { 'ruido-marron': 0.8, lluvia: 0.3 },
    art: { palette: 'mist', motif: 'hills', seed: 806 },
  },
  {
    id: 'tren-nocturno',
    name: 'Tren nocturno',
    mix: { tren: 0.85, lluvia: 0.25 },
    art: { palette: 'night', motif: 'train', seed: 807 },
  },
  {
    id: 'invierno',
    name: 'Invierno junto al fuego',
    mix: { fuego: 0.8, viento: 0.45, ronroneo: 0.3 },
    art: { palette: 'snow', motif: 'cabin', seed: 808 },
  },
];

export function sourceLabel(id: SourceId): string {
  if (id.startsWith('m-') || id.startsWith('b-')) return MUSIC_BY_ID[id as MusicId]?.title ?? id;
  return SOUND_BY_ID[id as SoundId]?.name ?? id;
}
