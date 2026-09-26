/**
 * Everything about Eli and her services lives here, so links, copy and the
 * next workshop can be updated in one place.
 */

export const ELI = {
  name: 'Eli',
  fullName: 'Eli Curcio',
  handle: '@mindfulnessbyeli',
  instagram: 'https://www.instagram.com/mindfulnessbyeli',
  photo: '/eli/eli.jpg',
  avatar: '/eli/eli-avatar.jpg',
  /** Direct WhatsApp chat (the same number Eli publishes in her booking form). */
  whatsappNumber: '5491121829771',
  /** Intake + booking form for 1:1 sessions. */
  bookingForm: 'https://tally.so/r/PdLOqb',
  credentials: [
    'Profesora de mindfulness (Asociación Argentina de Mindfulness, formación con base en MBSR)',
    'Instructora de yoga',
    'Coach ontológica',
  ],
  approach:
    'Mi enfoque es práctico: llevar estas herramientas a la vida real. El objetivo no es vivir sin estrés ni dejar de tener responsabilidades, sino relacionarnos de otra manera con todo lo que pasa.',
  /** What women usually bring to a first session (from Eli's intake form). */
  topics: ['Estrés', 'Mente acelerada', 'Autoexigencia', 'Dificultad para descansar', 'Culpa'],
  steps: [
    { title: 'Elegís día y horario', text: 'En el formulario vas a encontrar el link para reservar tu lugar.' },
    { title: 'Confirmás tu sesión', text: 'Ahí mismo están los datos para hacer el pago.' },
    { title: 'Me contás de vos', text: 'Unas preguntas cortas para que llegue a la sesión conociéndote.' },
  ],
  /** Real quotes published on Eli's site. */
  testimonials: [
    'Me sirvió para salir del piloto automático y poder escucharme.',
    'Me llevé herramientas que vengo aplicando muy bien.',
    'Las prácticas que hicimos las vengo haciendo a diario.',
  ],
} as const;

export interface EliEvent {
  id: string;
  kind: string;
  title: string;
  subtitle: string;
  /** ISO start time; the event is promoted only until it starts. */
  startsAt: string;
  when: string;
  format: string;
  url: string;
}

/** Update or add an edition here; past events disappear on their own. */
export const EVENTS: EliEvent[] = [
  {
    id: 'workshop-piloto-automatico-2026-10',
    kind: 'Workshop online en vivo',
    title: 'Estrés y autoexigencia: cómo salir del piloto automático',
    subtitle: 'Un encuentro práctico para mujeres que están todo el día resolviendo, y a las que incluso descansar les cuesta.',
    startsAt: '2026-10-03T10:00:00-03:00',
    when: 'Sábado 3 de octubre · 10 h (Argentina)',
    format: 'Online · En vivo · 90 min · Queda grabado',
    url: 'https://mindfulness-by-eli.vercel.app/workshop',
  },
];

export function nextEvent(now = Date.now()): EliEvent | undefined {
  return EVENTS.filter((e) => Date.parse(e.startsAt) > now).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
}

/** Where a call to action was shown; travels as utm_content so Eli can see what works. */
export type EliPlacement =
  | 'home'
  | 'completion'
  | 'program'
  | 'checkin'
  | 'profile'
  | 'settings'
  | 'eli-page'
  | 'welcome'
  | 'workshop';

const UTM = 'utm_source=app&utm_medium=mindfulness-by-eli';

export function bookingUrl(placement: EliPlacement): string {
  return `${ELI.bookingForm}?${UTM}&utm_campaign=sesion-1a1&utm_content=${placement}`;
}

export function eventUrl(event: EliEvent, placement: EliPlacement): string {
  return `${event.url}?${UTM}&utm_campaign=${event.id}&utm_content=${placement}`;
}

export type WhatsAppTopic = 'hello' | 'sessions' | 'support' | 'workshop' | 'program' | 'program-doing';

/** A ready-to-send first message in the user's own voice; she can edit it before sending. */
export function whatsappMessage(topic: WhatsAppTopic, opts: { name?: string; struggles?: string | null; program?: string } = {}): string {
  const hi = `¡Hola Eli! ${opts.name ? `Soy ${opts.name}, v` : 'V'}engo de la app CalmabyEli 🌸`;
  switch (topic) {
    case 'sessions':
      return `${hi} Me gustaría saber más sobre las sesiones 1:1.${opts.struggles ? ` Me está costando ${opts.struggles}.` : ''}`;
    case 'support':
      return `${hi} Estoy pasando unos días difíciles${opts.struggles ? ` (me está costando ${opts.struggles})` : ''} y me gustaría hablar con vos.`;
    case 'workshop':
      return `${hi} Quiero info sobre el workshop.`;
    case 'program-doing':
      return `${hi} Estoy haciendo el programa${opts.program ? ` «${opts.program}»` : ''} y me gustaría saber más sobre las sesiones 1:1.`;
    case 'program':
      return `${hi} Terminé el programa${opts.program ? ` «${opts.program}»` : ''} y me gustaría seguir trabajando esto con vos.`;
    default:
      return `${hi} Te quería hacer una consulta.`;
  }
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/${ELI.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
