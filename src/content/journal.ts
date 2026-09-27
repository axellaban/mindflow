export const JOURNAL_PROMPTS: string[] = [
  '¿Qué te hizo sonreír hoy?',
  '¿Qué necesitás soltar esta noche?',
  'Nombrá tres cosas por las que sentís gratitud hoy.',
  '¿Qué pequeño momento querés recordar de este día?',
  '¿Cómo te hablaste hoy? ¿Qué te dirías con más amabilidad?',
  '¿Qué te dio energía hoy, y qué te la quitó?',
  '¿A quién te gustaría agradecerle algo, y por qué?',
  '¿Qué aprendiste hoy sobre vos?',
  'Si hoy fuera un clima, ¿cuál sería? ¿Por qué?',
  '¿Qué harías mañana si te trataras como a tu mejor amiga?',
  '¿Qué preocupación podés dejar para mañana?',
  '¿Qué parte de tu cuerpo necesita más cuidado hoy?',
  '¿Qué cosa sencilla te hizo bien esta semana?',
  '¿Qué límite te gustaría poner o sostener?',
  '¿Dónde encontraste un momento de calma hoy?',
  '¿Qué te gustaría sentir más a menudo? ¿Qué lo facilita?',
  'Describí un lugar donde te sentís en paz.',
  '¿Qué logro pequeño merece reconocimiento hoy?',
  '¿Qué pensamiento se repitió hoy? ¿Es un hecho o una historia?',
  '¿Qué intención querés llevar a mañana?',
  '¿En qué te exigiste de más hoy? ¿Qué te diría una amiga?',
  '¿Qué hiciste hoy solo para vos?',
  '¿Qué podrías delegar o soltar esta semana?',
];

export const FEELINGS: { id: string; label: string; tone: 'up' | 'calm' | 'down' | 'tense' }[] = [
  { id: 'tranquilidad', label: 'Tranquilidad', tone: 'calm' },
  { id: 'gratitud', label: 'Gratitud', tone: 'up' },
  { id: 'alegria', label: 'Alegría', tone: 'up' },
  { id: 'energia', label: 'Energía', tone: 'up' },
  { id: 'esperanza', label: 'Esperanza', tone: 'up' },
  { id: 'enfoque', label: 'Enfoque', tone: 'calm' },
  { id: 'cansancio', label: 'Cansancio', tone: 'down' },
  { id: 'tristeza', label: 'Tristeza', tone: 'down' },
  { id: 'soledad', label: 'Soledad', tone: 'down' },
  { id: 'ansiedad', label: 'Ansiedad', tone: 'tense' },
  { id: 'estres', label: 'Estrés', tone: 'tense' },
  { id: 'enojo', label: 'Enojo', tone: 'tense' },
  { id: 'abrumado', label: 'Agobio', tone: 'tense' },
  { id: 'inquietud', label: 'Inquietud', tone: 'tense' },
  { id: 'culpa', label: 'Culpa', tone: 'down' },
];

/** The inner weather, from a stormy sea to a sunny shore. */
export const MOODS = [
  { level: 1, label: 'Muy mal', color: '#7f91b3' },
  { level: 2, label: 'Mal', color: '#92b4cf' },
  { level: 3, label: 'Normal', color: '#a8dcd5' },
  { level: 4, label: 'Bien', color: '#f4cda2' },
  { level: 5, label: 'Muy bien', color: '#ffe3a1' },
] as const;

export type MoodLevel = 1 | 2 | 3 | 4 | 5;
