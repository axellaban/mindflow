export type PaletteId =
  | 'dusk'
  | 'night'
  | 'dawn'
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'rain'
  | 'aurora'
  | 'ember'
  | 'snow'
  | 'desert'
  | 'lavender'
  | 'mist'
  | 'gold'
  | 'teal'
  | 'plum';

export type Motif =
  | 'mountains'
  | 'hills'
  | 'lake'
  | 'waves'
  | 'forest'
  | 'dunes'
  | 'moon'
  | 'sun'
  | 'aurora'
  | 'clouds'
  | 'orb'
  | 'rain'
  | 'stars'
  | 'flame'
  | 'train'
  | 'lighthouse'
  | 'cabin'
  | 'window'
  | 'bamboo'
  | 'path';

export interface ArtSpec {
  palette: PaletteId;
  motif: Motif;
  seed: number;
}

export type CategoryId =
  | 'ansiedad'
  | 'estres'
  | 'sueno'
  | 'enfoque'
  | 'principiantes'
  | 'autocompasion'
  | 'emociones'
  | 'mananas'
  | 'cuerpo';

export type GoalId = 'dormir' | 'estres' | 'ansiedad' | 'enfoque' | 'aprender' | 'autocuidado' | 'felicidad';

export type SoundId =
  | 'lluvia'
  | 'lluvia-techo'
  | 'tormenta'
  | 'oceano'
  | 'lago'
  | 'arroyo'
  | 'viento'
  | 'bosque'
  | 'grillos'
  | 'fuego'
  | 'tren'
  | 'ventilador'
  | 'ronroneo'
  | 'campanillas'
  | 'ruido-blanco'
  | 'ruido-rosa'
  | 'ruido-marron';

export type MusicId =
  | 'm-horizonte'
  | 'm-piano'
  | 'm-kalimba'
  | 'm-cuencos'
  | 'm-cristal'
  | 'm-drone'
  | 'b-alfa'
  | 'b-theta'
  | 'b-delta';

export type SourceId = SoundId | MusicId;

/** A set of simultaneous layers and their relative levels (0–1). */
export type Mix = Partial<Record<SourceId, number>>;

export type BedId =
  | 'none'
  | 'pad'
  | 'piano'
  | 'cuencos'
  | 'lluvia'
  | 'oceano'
  | 'bosque'
  | 'fuego'
  | 'noche'
  | 'arroyo'
  | 'tren'
  | 'biblioteca'
  | 'cabana'
  | 'faro'
  | 'desierto'
  | 'viento';

export type Narrator = 'luz' | 'mateo';

export type SessionKind = 'meditation' | 'story';

export interface Session {
  id: string;
  kind: SessionKind;
  title: string;
  /** One-line hook shown under the title. */
  subtitle: string;
  description: string;
  categories: CategoryId[];
  narrator: Narrator;
  art: ArtSpec;
  bed: BedId;
  /** Sleep content: no end-of-session screen, background keeps playing and fades out. */
  sleep?: boolean;
  daily?: { theme: string; phrase: string };
  program?: { id: ProgramId; day: number };
  /** Shown in the "Para ti" rails when the goal matches. */
  goals?: GoalId[];
  /** Filled from the generated audio manifest. */
  duration: number;
}

export type ProgramId = 'aprende-a-meditar' | 'duerme-profundo' | 'calma-la-ansiedad';

export interface Program {
  id: ProgramId;
  title: string;
  subtitle: string;
  description: string;
  unit: 'Día' | 'Noche';
  art: ArtSpec;
  sessions: string[];
  goals: GoalId[];
  outcome: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  art: ArtSpec;
}

export interface Quote {
  text: string;
  author?: string;
}
