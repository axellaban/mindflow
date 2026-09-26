import type { Quote } from './types';

/**
 * Classical quotes (public domain sources, translated) and original lines.
 * Attributions are kept only where the source is well established.
 */
export const QUOTES: Quote[] = [
  { text: 'En ningún lugar puede una persona encontrar un retiro más tranquilo que en su propia alma.', author: 'Marco Aurelio' },
  { text: 'Mientras aplazamos, la vida pasa.', author: 'Séneca' },
  { text: 'Sufrimos más a menudo en la imaginación que en la realidad.', author: 'Séneca' },
  { text: 'No nos perturban las cosas, sino las opiniones que tenemos sobre ellas.', author: 'Epicteto' },
  { text: 'Un viaje de mil leguas comienza con un solo paso.', author: 'Lao Tse' },
  { text: 'Caminante, no hay camino, se hace camino al andar.', author: 'Antonio Machado' },
  { text: 'Nadie se baña dos veces en el mismo río.', author: 'Heráclito' },
  { text: 'El odio nunca se apaga con odio; solo con amor se apaga.', author: 'Dhammapada' },
  {
    text: 'Toda la desdicha de los hombres proviene de no saber quedarse tranquilos en una habitación.',
    author: 'Blaise Pascal',
  },
  { text: 'Si lloras porque se fue el sol, las lágrimas no te dejarán ver las estrellas.', author: 'Rabindranath Tagore' },
  { text: 'La mariposa no cuenta meses, sino momentos, y tiene tiempo suficiente.', author: 'Rabindranath Tagore' },
  { text: 'Cuando camines, camina. Cuando comas, come.', author: 'Proverbio zen' },
  { text: 'Conocer a otros es inteligencia; conocerse a uno mismo es sabiduría.', author: 'Lao Tse' },
  { text: 'El alma se tiñe del color de sus pensamientos.', author: 'Marco Aurelio' },
  { text: 'Lo que crece despacio, crece fuerte.' },
  { text: 'No tienes que calmar la tormenta. Solo encontrar el centro en calma dentro de ella.' },
  { text: 'Respira. Este momento también es tuyo.' },
  { text: 'Descansar también es avanzar.' },
  { text: 'Siempre puedes empezar de nuevo, con la próxima respiración.' },
  { text: 'Tus pensamientos son nubes. Tú eres el cielo.' },
  { text: 'Nada es permanente: ni lo difícil, ni lo hermoso. Por eso vale la pena estar presente.' },
  { text: 'La calma no es la ausencia de ruido, sino la presencia de atención.' },
  { text: 'Sé amable contigo. Estás haciendo lo mejor que puedes con lo que tienes.' },
  { text: 'Una sola respiración consciente ya es un regreso a casa.' },
  { text: 'No hace falta ver toda la escalera. Solo el siguiente escalón.' },
  { text: 'Lo que resistes, persiste. Lo que aceptas, se transforma.' },
  { text: 'El presente es el único lugar donde la vida ocurre.' },
  { text: 'Hoy no tienes que resolverlo todo. Solo lo que está frente a ti.' },
  { text: 'La mente es como el agua: cuando se aquieta, todo se ve con claridad.' },
  { text: 'Puedes sentirlo todo y, aun así, recordar tu base.' },
  { text: 'Pequeñas pausas, grandes cambios.' },
  { text: 'Lo pequeño también es grande, si lo miras con atención.' },
  { text: 'La paciencia no es esperar: es confiar en lo que todavía no se ve.' },
  { text: 'Cuida de ti como cuidarías de alguien a quien amas.' },
  { text: 'Esto también pasará.' },
  { text: 'Me doblo, pero no me rompo.' },
  { text: 'Donde va tu atención, fluye tu energía.' },
  { text: 'El silencio no está vacío: está lleno de respuestas.' },
  { text: 'Deja que el día termine. Mañana será otro comienzo.' },
  { text: 'No eres tus pensamientos; eres quien los observa.' },
];

export function quoteForDay(dayNumber: number): Quote {
  return QUOTES[((dayNumber % QUOTES.length) + QUOTES.length) % QUOTES.length]!;
}
