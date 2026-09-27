import type { PaletteId } from './types';

export type PhaseKind = 'in' | 'hold' | 'out' | 'rest' | 'in2';

export interface BreathPhase {
  kind: PhaseKind;
  seconds: number;
  label: string;
}

export interface BreathPattern {
  id: string;
  name: string;
  short: string;
  benefit: string;
  description: string;
  phases: BreathPhase[];
  palette: PaletteId;
  recommendedMinutes: number;
}

const IN = (s: number, label = 'Inhalá'): BreathPhase => ({ kind: 'in', seconds: s, label });
const OUT = (s: number, label = 'Exhalá'): BreathPhase => ({ kind: 'out', seconds: s, label });
const HOLD = (s: number, label = 'Sostené'): BreathPhase => ({ kind: 'hold', seconds: s, label });
const REST = (s: number, label = 'Pausa'): BreathPhase => ({ kind: 'rest', seconds: s, label });

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: 'coherencia',
    name: 'Coherencia',
    short: '5,5 · 5,5',
    benefit: 'Equilibrio',
    description:
      'Unas seis respiraciones por minuto, el ritmo en el que el corazón y la respiración se sincronizan. Ideal para cualquier momento del día.',
    phases: [IN(5.5), OUT(5.5)],
    palette: 'teal',
    recommendedMinutes: 5,
  },
  {
    id: 'calma',
    name: 'Calma rápida',
    short: '4 · 6',
    benefit: 'Bajar revoluciones',
    description:
      'Exhalar más largo de lo que inhalás activa el sistema de descanso del cuerpo. El interruptor más sencillo para calmar la ansiedad.',
    phases: [IN(4), OUT(6)],
    palette: 'ocean',
    recommendedMinutes: 3,
  },
  {
    id: 'cuadrada',
    name: 'Respiración cuadrada',
    short: '4 · 4 · 4 · 4',
    benefit: 'Claridad y control',
    description:
      'Cuatro tiempos iguales: inhalar, sostener, exhalar, sostener. Usada por deportistas y equipos de rescate para mantener la calma bajo presión.',
    phases: [IN(4), HOLD(4), OUT(4), REST(4, 'Sostené')],
    palette: 'mist',
    recommendedMinutes: 4,
  },
  {
    id: '478',
    name: 'Relajación 4-7-8',
    short: '4 · 7 · 8',
    benefit: 'Para dormir',
    description:
      'Inhalá en cuatro, sostené en siete y exhalá lentamente en ocho. Un sedante natural para el sistema nervioso, perfecto antes de dormir.',
    phases: [IN(4), HOLD(7), OUT(8)],
    palette: 'night',
    recommendedMinutes: 3,
  },
  {
    id: 'suspiro',
    name: 'Suspiro fisiológico',
    short: '2 + 1 · 6',
    benefit: 'Alivio inmediato',
    description:
      'Dos inhalaciones seguidas por la nariz y una exhalación larga por la boca. La forma más rápida que conoce la ciencia de reducir el estrés en tiempo real.',
    phases: [IN(2.2), { kind: 'in2', seconds: 1, label: 'Un poco más' }, OUT(6, 'Soltá todo')],
    palette: 'sunset',
    recommendedMinutes: 2,
  },
  {
    id: 'energia',
    name: 'Energía',
    short: '4 · 2',
    benefit: 'Despertar',
    description:
      'Inhalaciones profundas y exhalaciones más cortas para despertar el cuerpo y la mente. Ideal por la mañana o después de comer.',
    phases: [IN(4), OUT(2)],
    palette: 'gold',
    recommendedMinutes: 2,
  },
];

export const BREATH_BY_ID = Object.fromEntries(BREATH_PATTERNS.map((p) => [p.id, p]));

export function cycleSeconds(p: BreathPattern): number {
  return p.phases.reduce((acc, ph) => acc + ph.seconds, 0);
}
