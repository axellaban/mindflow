export type AchievementId =
  | 'primer-paso'
  | 'racha-3'
  | 'racha-7'
  | 'racha-21'
  | 'racha-30'
  | 'minutos-60'
  | 'minutos-300'
  | 'minutos-600'
  | 'programa'
  | 'noche'
  | 'respira-10'
  | 'silencio'
  | 'diario-7'
  | 'curiosidad'
  | 'madrugada';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'primer-paso', title: 'Primer paso', description: 'Completaste tu primera práctica.', icon: 'Sprout' },
  { id: 'racha-3', title: 'Tres días seguidos', description: 'Practicaste tres días consecutivos.', icon: 'Flame' },
  { id: 'racha-7', title: 'Una semana en calma', description: 'Siete días seguidos de práctica.', icon: 'Sun' },
  { id: 'racha-21', title: 'Hábito en marcha', description: 'Veintiún días seguidos: ya es parte de ti.', icon: 'Mountain' },
  { id: 'racha-30', title: 'Un mes de calma', description: 'Treinta días seguidos de práctica.', icon: 'Crown' },
  { id: 'minutos-60', title: 'Una hora para ti', description: 'Sumaste sesenta minutos de práctica.', icon: 'Hourglass' },
  { id: 'minutos-300', title: 'Cinco horas', description: 'Cinco horas dedicadas a tu bienestar.', icon: 'Gem' },
  { id: 'minutos-600', title: 'Diez horas', description: 'Diez horas de atención y calma.', icon: 'Sparkles' },
  { id: 'programa', title: 'Programa completo', description: 'Terminaste un programa de principio a fin.', icon: 'Award' },
  { id: 'noche', title: 'Buenas noches', description: 'Te dormiste con una práctica para dormir.', icon: 'Moon' },
  { id: 'respira-10', title: 'Pulmones sabios', description: 'Completaste diez ejercicios de respiración.', icon: 'Wind' },
  { id: 'silencio', title: 'Silencio propio', description: 'Tres meditaciones con el temporizador.', icon: 'Timer' },
  { id: 'diario-7', title: 'Conocerte', description: 'Siete registros de ánimo o diario.', icon: 'NotebookPen' },
  { id: 'curiosidad', title: 'Mente curiosa', description: 'Exploraste cinco temas distintos.', icon: 'Compass' },
  { id: 'madrugada', title: 'Temprano', description: 'Practicaste antes de las ocho de la mañana.', icon: 'Sunrise' },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<
  AchievementId,
  AchievementDef
>;
