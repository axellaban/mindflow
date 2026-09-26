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
  { text: 'No tenés que calmar la tormenta. Solo encontrar el centro en calma dentro de ella.' },
  { text: 'Respirá. Este momento también es tuyo.' },
  { text: 'Descansar también es avanzar.' },
  { text: 'Siempre podés empezar de nuevo, con la próxima respiración.' },
  { text: 'Tus pensamientos son nubes. Vos sos el cielo.' },
  { text: 'Nada es permanente: ni lo difícil, ni lo hermoso. Por eso vale la pena estar presente.' },
  { text: 'La calma no es la ausencia de ruido, sino la presencia de atención.' },
  { text: 'Sé amable con vos. Estás haciendo lo mejor que podés con lo que tenés.' },
  { text: 'Una sola respiración consciente ya es un regreso a casa.' },
  { text: 'No hace falta ver toda la escalera. Solo el siguiente escalón.' },
  { text: 'Lo que resistes, persiste. Lo que aceptas, se transforma.' },
  { text: 'El presente es el único lugar donde la vida ocurre.' },
  { text: 'Hoy no tenés que resolverlo todo. Solo lo que está frente a vos.' },
  { text: 'La mente es como el agua: cuando se aquieta, todo se ve con claridad.' },
  { text: 'Podés sentirlo todo y, aun así, recordar tu base.' },
  { text: 'Pequeñas pausas, grandes cambios.' },
  { text: 'Lo pequeño también es grande, si lo mirás con atención.' },
  { text: 'La paciencia no es esperar: es confiar en lo que todavía no se ve.' },
  { text: 'Cuidate como cuidarías a alguien que amás.' },
  { text: 'Esto también pasará.' },
  { text: 'Me doblo, pero no me rompo.' },
  { text: 'Donde va tu atención, fluye tu energía.' },
  { text: 'El silencio no está vacío: está lleno de respuestas.' },
  { text: 'Dejá que el día termine. Mañana es otro comienzo.' },
  { text: 'No sos tus pensamientos: sos quien los observa.' },
  { text: 'No tenés que ganarte el descanso.' },
  { text: 'Sos suficiente, incluso los días en que no llegás a todo.' },
  { text: 'Hablate como le hablarías a tu mejor amiga.' },
  { text: 'Un límite puesto con amor es un sí para vos.' },
  { text: 'Bajar un cambio no es hacer menos: es vivir lo que hacés con más presencia.' },
];

export function quoteForDay(dayNumber: number): Quote {
  return QUOTES[((dayNumber % QUOTES.length) + QUOTES.length) % QUOTES.length]!;
}
