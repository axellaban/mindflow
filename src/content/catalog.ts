import manifest from './generated/audio-manifest.json';
import type { Category, CategoryId, Program, ProgramId, Session } from './types';

type AudioInfo = { duration: number; voice: string; bytes: number; v: string };
const audio = manifest as Record<string, AudioInfo>;

type SessionSeed = Omit<Session, 'duration'>;

const SEEDS: SessionSeed[] = [
  // ─────────────────────────────── Bajar un cambio
  {
    id: 'buc-1-piloto-automatico',
    kind: 'meditation',
    title: 'Salir del piloto automático',
    subtitle: 'Una pausa en cuatro pasos',
    description:
      'Terminás algo y tu cabeza ya está en lo siguiente. Aprendé una pausa simple (detenerte, respirar, observar y seguir) para volver al presente en cualquier momento del día.',
    categories: ['autoexigencia', 'estres'],
    narrator: 'luz',
    art: { palette: 'rose', motif: 'hills', seed: 801 },
    bed: 'piano',
    program: { id: 'bajar-un-cambio', day: 1 },
    goals: ['estres', 'mente'],
  },
  {
    id: 'buc-2-mente-acelerada',
    kind: 'meditation',
    title: 'La mente acelerada',
    subtitle: 'Nombrar para hacer espacio',
    description:
      'Mil pestañas abiertas y ninguna forma de frenar. No se trata de vaciar la mente, sino de cambiar tu relación con los pensamientos: nombrarlos y volver.',
    categories: ['autoexigencia', 'ansiedad'],
    narrator: 'luz',
    art: { palette: 'rose', motif: 'clouds', seed: 802 },
    bed: 'pad',
    program: { id: 'bajar-un-cambio', day: 2 },
    goals: ['mente', 'ansiedad'],
  },
  {
    id: 'buc-3-autoexigencia',
    kind: 'meditation',
    title: 'La voz de la autoexigencia',
    subtitle: 'Hablarte como a una amiga',
    description:
      'Esa voz que dice que nunca alcanza. En vez de pelearte con ella, vas a escucharla, entender qué intenta cuidar y responderle con más ternura.',
    categories: ['autoexigencia', 'autocompasion'],
    narrator: 'luz',
    art: { palette: 'rose', motif: 'orb', seed: 803 },
    bed: 'cuencos',
    program: { id: 'bajar-un-cambio', day: 3 },
    goals: ['autoexigencia'],
  },
  {
    id: 'buc-4-culpa',
    kind: 'meditation',
    title: 'Soltar la culpa',
    subtitle: 'La mochila que no te toca cargar',
    description:
      'Culpa por descansar, por decir que no, por no llegar a todo. Una práctica para distinguir la culpa que enseña de la que solo pesa, y apoyar esa mochila en el suelo.',
    categories: ['autoexigencia', 'emociones'],
    narrator: 'luz',
    art: { palette: 'rose', motif: 'beach', seed: 804 },
    bed: 'arroyo',
    program: { id: 'bajar-un-cambio', day: 4 },
    goals: ['culpa', 'autoexigencia'],
  },
  {
    id: 'buc-5-descanso',
    kind: 'meditation',
    title: 'Permiso para descansar',
    subtitle: 'Sin tener que ganártelo',
    description:
      'Descansar no es un premio por terminar todo: la lista nunca termina. Un recorrido por el cuerpo para aflojar de verdad y darte permiso para parar.',
    categories: ['autoexigencia', 'cuerpo'],
    narrator: 'luz',
    art: { palette: 'rose', motif: 'moon', seed: 805 },
    bed: 'lluvia',
    program: { id: 'bajar-un-cambio', day: 5 },
    goals: ['descanso', 'autoexigencia'],
  },

  // ─────────────────────────────── Aprende a meditar
  {
    id: 'aam-1-respiracion',
    kind: 'meditation',
    title: 'La respiración',
    subtitle: 'Tu ancla en el presente',
    description:
      'Empezamos por lo más básico y lo más poderoso: la respiración. Aprendé a usarla como ancla y a volver a ella cada vez que la mente se va.',
    categories: ['principiantes'],
    narrator: 'luz',
    art: { palette: 'dawn', motif: 'sun', seed: 101 },
    bed: 'pad',
    program: { id: 'aprende-a-meditar', day: 1 },
  },
  {
    id: 'aam-2-cuerpo',
    kind: 'meditation',
    title: 'El cuerpo',
    subtitle: 'Habitar tus sensaciones',
    description:
      'Un recorrido amable de los pies a la cabeza para escuchar al cuerpo, que siempre está acá, enviándote información.',
    categories: ['principiantes', 'cuerpo'],
    narrator: 'luz',
    art: { palette: 'dawn', motif: 'hills', seed: 102 },
    bed: 'pad',
    program: { id: 'aprende-a-meditar', day: 2 },
  },
  {
    id: 'aam-3-pensamientos',
    kind: 'meditation',
    title: 'Los pensamientos',
    subtitle: 'Nubes en un cielo amplio',
    description:
      'Meditar no es dejar la mente en blanco. Aprendé a ver pasar los pensamientos sin subirte a cada uno de ellos.',
    categories: ['principiantes'],
    narrator: 'luz',
    art: { palette: 'lavender', motif: 'clouds', seed: 103 },
    bed: 'pad',
    program: { id: 'aprende-a-meditar', day: 3 },
  },
  {
    id: 'aam-4-emociones',
    kind: 'meditation',
    title: 'Las emociones',
    subtitle: 'El clima interior',
    description:
      'Sentir la emoción en el cuerpo, ponerle nombre y respirar con ella. Tres pasos sencillos para no quedar a merced de lo que sentís.',
    categories: ['principiantes', 'emociones'],
    narrator: 'luz',
    art: { palette: 'plum', motif: 'orb', seed: 104 },
    bed: 'pad',
    program: { id: 'aprende-a-meditar', day: 4 },
  },
  {
    id: 'aam-5-sentidos',
    kind: 'meditation',
    title: 'Los sentidos',
    subtitle: 'Conciencia abierta',
    description:
      'Los sonidos, el tacto, la luz: cualquier experiencia puede ser una puerta al presente. Hoy practicás la conciencia abierta.',
    categories: ['principiantes'],
    narrator: 'luz',
    art: { palette: 'mist', motif: 'lake', seed: 105 },
    bed: 'bosque',
    program: { id: 'aprende-a-meditar', day: 5 },
  },
  {
    id: 'aam-6-bondad',
    kind: 'meditation',
    title: 'La bondad',
    subtitle: 'El tono de tu atención',
    description:
      'Una de las prácticas más antiguas y estudiadas: cultivar buenos deseos hacia vos, hacia alguien querido y hacia el mundo.',
    categories: ['principiantes', 'autocompasion'],
    narrator: 'luz',
    art: { palette: 'gold', motif: 'sun', seed: 106 },
    bed: 'piano',
    program: { id: 'aprende-a-meditar', day: 6 },
  },
  {
    id: 'aam-7-tu-practica',
    kind: 'meditation',
    title: 'Tu práctica',
    subtitle: 'Minutos de silencio propio',
    description:
      'Reunimos todo lo aprendido y te regalamos un tiempo de práctica en silencio, a tu manera. El comienzo de una práctica propia.',
    categories: ['principiantes'],
    narrator: 'luz',
    art: { palette: 'dawn', motif: 'mountains', seed: 107 },
    bed: 'cuencos',
    program: { id: 'aprende-a-meditar', day: 7 },
  },

  // ─────────────────────────────── Duerme profundo
  {
    id: 'dp-1-soltar-el-dia',
    kind: 'meditation',
    title: 'Soltar el día',
    subtitle: 'Cerrá el libro de hoy',
    description:
      'Un repaso suave del día, como quien hojea un libro antes de cerrarlo. Para dejar atrás lo pendiente y entregarte al descanso.',
    categories: ['sueno'],
    narrator: 'luz',
    art: { palette: 'night', motif: 'moon', seed: 201 },
    bed: 'noche',
    sleep: true,
    program: { id: 'duerme-profundo', day: 1 },
  },
  {
    id: 'dp-2-respirar-para-dormir',
    kind: 'meditation',
    title: 'Respirar para dormir',
    subtitle: 'La respiración 4-7-8',
    description:
      'Alargar la exhalación le dice al cuerpo que está a salvo. Practicá la respiración 4-7-8 y una cuenta regresiva que invita al sueño.',
    categories: ['sueno', 'ansiedad'],
    narrator: 'luz',
    art: { palette: 'night', motif: 'stars', seed: 202 },
    bed: 'pad',
    sleep: true,
    program: { id: 'duerme-profundo', day: 2 },
  },
  {
    id: 'dp-3-escaneo-corporal',
    kind: 'meditation',
    title: 'Escaneo corporal para dormir',
    subtitle: 'Pesado, tibio, quieto',
    description:
      'Recorré el cuerpo parte por parte e invitá a cada zona a soltarse. Una de las prácticas más eficaces para conciliar el sueño.',
    categories: ['sueno', 'cuerpo'],
    narrator: 'luz',
    art: { palette: 'lavender', motif: 'moon', seed: 203 },
    bed: 'lluvia',
    sleep: true,
    program: { id: 'duerme-profundo', day: 3 },
  },
  {
    id: 'dp-4-aquietar-la-mente',
    kind: 'meditation',
    title: 'Aquietar la mente',
    subtitle: 'Cuando no podés dejar de pensar',
    description:
      'Guardá las preocupaciones en una caja y entretené al cerebro con un juego de imágenes al azar, una técnica que ayuda a entrar en modo sueño.',
    categories: ['sueno', 'ansiedad'],
    narrator: 'luz',
    art: { palette: 'plum', motif: 'stars', seed: 204 },
    bed: 'lluvia',
    sleep: true,
    program: { id: 'duerme-profundo', day: 4 },
  },
  {
    id: 'dp-5-el-lago',
    kind: 'meditation',
    title: 'El lago en calma',
    subtitle: 'Visualización nocturna',
    description:
      'Un paseo imaginario hasta un muelle de madera, junto a un lago quieto como un espejo, mientras el cielo se llena de estrellas.',
    categories: ['sueno'],
    narrator: 'luz',
    art: { palette: 'dusk', motif: 'lake', seed: 205 },
    bed: 'noche',
    sleep: true,
    program: { id: 'duerme-profundo', day: 5 },
  },

  // ─────────────────────────────── Calma la ansiedad
  {
    id: 'cla-1-entender',
    kind: 'meditation',
    title: 'Entender la ansiedad',
    subtitle: 'Tu alarma interna y su interruptor',
    description:
      'La ansiedad es una alarma que a veces suena sin peligro. Aprendé cómo funciona y practicá el interruptor más sencillo: exhalar más largo de lo que inhalás.',
    categories: ['ansiedad'],
    narrator: 'luz',
    art: { palette: 'teal', motif: 'waves', seed: 301 },
    bed: 'pad',
    program: { id: 'calma-la-ansiedad', day: 1 },
  },
  {
    id: 'cla-2-anclar',
    kind: 'meditation',
    title: 'Anclar en el cuerpo',
    subtitle: 'El ejercicio 5-4-3-2-1',
    description:
      'Cuando la mente se va al futuro, el cuerpo te trae de vuelta. Pies en el suelo, sentidos despiertos y la técnica 5-4-3-2-1.',
    categories: ['ansiedad', 'cuerpo'],
    narrator: 'luz',
    art: { palette: 'teal', motif: 'mountains', seed: 302 },
    bed: 'pad',
    program: { id: 'calma-la-ansiedad', day: 2 },
  },
  {
    id: 'cla-3-hacer-espacio',
    kind: 'meditation',
    title: 'Hacer espacio',
    subtitle: 'La práctica RAIN',
    description:
      'Reconocer, aceptar, investigar y nutrir. Cuatro pasos para hacerle espacio a una emoción difícil en lugar de pelear con ella.',
    categories: ['ansiedad', 'emociones'],
    narrator: 'luz',
    art: { palette: 'rain', motif: 'rain', seed: 303 },
    bed: 'lluvia',
    program: { id: 'calma-la-ansiedad', day: 3 },
  },
  {
    id: 'cla-4-pensamientos',
    kind: 'meditation',
    title: 'Los pensamientos no son hechos',
    subtitle: 'Hojas sobre el arroyo',
    description:
      'La ansiedad habla con una voz muy convincente. Aprendé a tomar distancia de sus pensamientos sin pelearte con ellos.',
    categories: ['ansiedad'],
    narrator: 'luz',
    art: { palette: 'forest', motif: 'path', seed: 304 },
    bed: 'arroyo',
    program: { id: 'calma-la-ansiedad', day: 4 },
  },
  {
    id: 'cla-5-cuidado',
    kind: 'meditation',
    title: 'Tratarte con cuidado',
    subtitle: 'Una pausa de autocompasión',
    description:
      'Tres frases y un gesto para acompañarte en los momentos difíciles con la misma calidez que le ofrecerías a alguien que querés.',
    categories: ['ansiedad', 'autocompasion'],
    narrator: 'luz',
    art: { palette: 'gold', motif: 'hills', seed: 305 },
    bed: 'piano',
    program: { id: 'calma-la-ansiedad', day: 5 },
  },

  // ─────────────────────────────── Sesiones sueltas
  {
    id: 'primera-meditacion',
    kind: 'meditation',
    title: 'Tu primera meditación',
    subtitle: 'Cinco minutos para empezar',
    description:
      '¿Nunca meditaste? Empezá acá. Cinco minutos, sin nada que lograr, para descubrir lo simple y valioso que es detenerse.',
    categories: ['principiantes'],
    narrator: 'luz',
    art: { palette: 'dawn', motif: 'lake', seed: 401 },
    bed: 'pad',
    goals: ['aprender'],
  },
  {
    id: 'sos-ansiedad',
    kind: 'meditation',
    title: 'SOS: calma inmediata',
    subtitle: 'Para momentos de ansiedad intensa',
    description:
      'Una guía directa para atravesar un pico de ansiedad o angustia: suspiros largos, pies en el suelo y tus sentidos como ancla.',
    categories: ['ansiedad'],
    narrator: 'luz',
    art: { palette: 'ocean', motif: 'waves', seed: 402 },
    bed: 'pad',
    goals: ['ansiedad'],
  },
  {
    id: 'pausa-3-minutos',
    kind: 'meditation',
    title: 'Pausa de tres minutos',
    subtitle: 'Un reinicio en cualquier lugar',
    description:
      'Abrir, enfocar y volver a abrir. Un reinicio breve y profundo para el medio del día, en tu escritorio o donde estés.',
    categories: ['estres'],
    narrator: 'luz',
    art: { palette: 'mist', motif: 'hills', seed: 403 },
    bed: 'pad',
    goals: ['estres', 'mente'],
  },
  {
    id: 'soltar-tension',
    kind: 'meditation',
    title: 'Soltar la tensión',
    subtitle: 'Cuando el estrés se queda en el cuerpo',
    description:
      'Mandíbula, hombros, estómago: recorré los lugares donde se acumula el estrés y desatá cada nudo con paciencia.',
    categories: ['estres', 'cuerpo'],
    narrator: 'luz',
    art: { palette: 'teal', motif: 'lake', seed: 404 },
    bed: 'pad',
    goals: ['estres'],
  },
  {
    id: 'enfoque-profundo',
    kind: 'meditation',
    title: 'Enfoque profundo',
    subtitle: 'Antes de trabajar o estudiar',
    description:
      'Entrená la atención como un músculo contando respiraciones, y terminá con una intención clara para tu próximo bloque de trabajo.',
    categories: ['enfoque'],
    narrator: 'luz',
    art: { palette: 'ocean', motif: 'mountains', seed: 405 },
    bed: 'cuencos',
    goals: ['mente'],
  },
  {
    id: 'despertar',
    kind: 'meditation',
    title: 'Despertar con intención',
    subtitle: 'Para empezar el día',
    description:
      'Estiramientos suaves, gratitud y una intención para el día. Siete minutos para empezar con calma en lugar de con prisa.',
    categories: ['mananas'],
    narrator: 'luz',
    art: { palette: 'dawn', motif: 'sun', seed: 406 },
    bed: 'bosque',
    goals: ['autocuidado'],
  },
  {
    id: 'cuerpo-en-paz',
    kind: 'meditation',
    title: 'Hacer las paces con tu cuerpo',
    subtitle: 'Mirarte con otros ojos',
    description:
      'Años de mirarnos con ojos críticos. Una práctica para sentir el cuerpo desde adentro, agradecerle lo que hace y dejar de estar en guerra con él.',
    categories: ['autocompasion', 'cuerpo'],
    narrator: 'luz',
    art: { palette: 'rose', motif: 'sun', seed: 811 },
    bed: 'piano',
    goals: ['autocuidado', 'autoexigencia'],
  },
  {
    id: 'poner-limites',
    kind: 'meditation',
    title: 'Poner límites con amor',
    subtitle: 'Decir que no sin culpa',
    description:
      'Escuchá tu sí y tu no en el cuerpo, ensayá una frase sencilla y descubrí que un límite no es un rechazo: es una forma de cuidarte y cuidar el vínculo.',
    categories: ['autoexigencia', 'emociones'],
    narrator: 'luz',
    art: { palette: 'sage', motif: 'mountains', seed: 812 },
    bed: 'bosque',
    goals: ['culpa', 'autocuidado'],
  },
  {
    id: 'carga-mental',
    kind: 'meditation',
    title: 'Cuando todo está en tu cabeza',
    subtitle: 'Para la carga mental',
    description:
      'Turnos, compras, cumpleaños, pendientes. Sacá la lista invisible de tu cabeza, elegí una sola cosa para hoy y hacé lugar para respirar.',
    categories: ['estres', 'autoexigencia'],
    narrator: 'luz',
    art: { palette: 'sage', motif: 'hills', seed: 813 },
    bed: 'pad',
    goals: ['mente', 'estres'],
  },
  {
    id: 'dias-de-periodo',
    kind: 'meditation',
    title: 'Días de período',
    subtitle: 'Alivio y ternura para tu cuerpo',
    description:
      'Para cuando hay dolor, cansancio o las emociones están a flor de piel. Respiración hacia el vientre, calor y una forma más amable de acompañarte.',
    categories: ['cuerpo', 'autocompasion'],
    narrator: 'luz',
    art: { palette: 'rose', motif: 'lake', seed: 814 },
    bed: 'lluvia',
    goals: ['autocuidado', 'descanso'],
  },
  {
    id: 'respiro-para-mamas',
    kind: 'meditation',
    title: 'Un respiro para mamás',
    subtitle: 'Cinco minutos para vos',
    description:
      'Mientras duermen, mientras juegan o encerrada en el baño: cinco minutos alcanzan para reconocer todo lo que sostenés y recordarte que vos también necesitás cuidado.',
    categories: ['estres', 'autocompasion'],
    narrator: 'luz',
    art: { palette: 'gold', motif: 'clouds', seed: 815 },
    bed: 'piano',
    goals: ['autocuidado', 'culpa'],
  },
  {
    id: 'energia-matinal',
    kind: 'meditation',
    title: 'Energía para empezar',
    subtitle: 'Despertar el cuerpo sin café',
    description:
      'Estiramientos, respiraciones energizantes y una intención clara. Seis minutos para pasar del sueño a la energía.',
    categories: ['mananas', 'cuerpo'],
    narrator: 'luz',
    art: { palette: 'gold', motif: 'sun', seed: 416 },
    bed: 'bosque',
    goals: ['mente', 'autocuidado'],
  },
  {
    id: 'cafe-consciente',
    kind: 'meditation',
    title: 'Café consciente',
    subtitle: 'Una pausa con tu taza de la mañana',
    description:
      'Convertí tu café o tu té en una pequeña meditación: el calor en las manos, el aroma, el primer sorbo. Cinco minutos para empezar con presencia.',
    categories: ['mananas', 'principiantes'],
    narrator: 'luz',
    art: { palette: 'sunset', motif: 'clouds', seed: 417 },
    bed: 'piano',
    goals: ['autocuidado', 'aprender'],
  },
  {
    id: 'gratitud',
    kind: 'meditation',
    title: 'Gratitud',
    subtitle: 'Mirar también lo bueno',
    description:
      'Tu cerebro está hecho para detectar problemas. Esta práctica lo entrena para ver también todo lo que ya está bien.',
    categories: ['emociones', 'autocompasion'],
    narrator: 'luz',
    art: { palette: 'gold', motif: 'hills', seed: 407 },
    bed: 'piano',
    goals: ['autocuidado'],
  },
  {
    id: 'bondad-amorosa',
    kind: 'meditation',
    title: 'Bondad amorosa',
    subtitle: 'La práctica de metta',
    description:
      'Buenos deseos para vos, para alguien querido, para alguien neutral e incluso para alguien difícil. Un corazón que se ensancha.',
    categories: ['autocompasion', 'emociones'],
    narrator: 'luz',
    art: { palette: 'sunset', motif: 'orb', seed: 408 },
    bed: 'piano',
    goals: ['autocuidado'],
  },
  {
    id: 'caminar',
    kind: 'meditation',
    title: 'Caminar con atención',
    subtitle: 'Meditación en movimiento',
    description:
      'Para practicar con los ojos abiertos, al aire libre o dentro de casa. Hoy el destino es cada paso.',
    categories: ['cuerpo', 'estres'],
    narrator: 'luz',
    art: { palette: 'forest', motif: 'path', seed: 409 },
    bed: 'none',
  },
  {
    id: 'nsdr',
    kind: 'meditation',
    title: 'Descanso profundo',
    subtitle: 'NSDR · inspirado en yoga nidra',
    description:
      'Veinte minutos de descanso profundo sin dormir para recuperar energía a media tarde o después de una mala noche.',
    categories: ['cuerpo', 'estres', 'sueno'],
    narrator: 'luz',
    art: { palette: 'lavender', motif: 'dunes', seed: 410 },
    bed: 'pad',
    goals: ['estres', 'dormir', 'mente'],
  },
  {
    id: 'montana',
    kind: 'meditation',
    title: 'La montaña',
    subtitle: 'Estabilidad ante cualquier clima',
    description:
      'Una meditación clásica: convertite en montaña y dejá pasar las estaciones, las tormentas y los días de sol sin perder tu base.',
    categories: ['estres', 'emociones'],
    narrator: 'luz',
    art: { palette: 'snow', motif: 'mountains', seed: 411 },
    bed: 'cuencos',
    goals: ['estres', 'ansiedad'],
  },
  {
    id: 'relajacion-progresiva',
    kind: 'meditation',
    title: 'Relajación muscular progresiva',
    subtitle: 'Tensar y soltar',
    description:
      'La técnica de Jacobson: tensar y soltar cada grupo muscular para que el cuerpo aprenda a relajarse más profundo.',
    categories: ['cuerpo', 'sueno', 'estres'],
    narrator: 'luz',
    art: { palette: 'rain', motif: 'hills', seed: 412 },
    bed: 'lluvia',
    goals: ['dormir', 'estres'],
  },
  {
    id: 'antes-de-algo-importante',
    kind: 'meditation',
    title: 'Antes de algo importante',
    subtitle: 'Confianza en cinco minutos',
    description:
      'Para los minutos previos a una entrevista, un examen o una conversación difícil. Convertí los nervios en energía enfocada.',
    categories: ['ansiedad', 'enfoque'],
    narrator: 'luz',
    art: { palette: 'sunset', motif: 'mountains', seed: 413 },
    bed: 'pad',
    goals: ['ansiedad', 'mente'],
  },
  {
    id: 'volver-a-dormir',
    kind: 'meditation',
    title: 'Volver a dormir',
    subtitle: 'Si te despertás en la noche',
    description:
      'Sin mirar el reloj, sin pelear con la mente. Peso, respiración lenta y una cuenta aburrida a propósito para volver al sueño.',
    categories: ['sueno'],
    narrator: 'luz',
    art: { palette: 'night', motif: 'moon', seed: 414 },
    bed: 'lluvia',
    sleep: true,
    goals: ['dormir'],
  },
  {
    id: 'cuando-sientes-enojo',
    kind: 'meditation',
    title: 'Cuando sentís enojo',
    subtitle: 'Espacio entre sentir y actuar',
    description:
      'El enojo es legítimo: avisa que algo importa. Enfriá el sistema y creá espacio antes de responder.',
    categories: ['emociones'],
    narrator: 'luz',
    art: { palette: 'ember', motif: 'flame', seed: 415 },
    bed: 'pad',
  },

  // ─────────────────────────────── La pausa del día
  {
    id: 'pausa-paciencia',
    kind: 'meditation',
    title: 'Paciencia',
    subtitle: 'Lo que crece despacio, crece fuerte',
    description: 'Las cosas que más valen crecen despacio. Una pausa para confiar en los procesos que todavía no se ven.',
    categories: ['estres'],
    narrator: 'luz',
    art: { palette: 'forest', motif: 'hills', seed: 501 },
    bed: 'pad',
    daily: { theme: 'Paciencia', phrase: 'Lo que crece despacio, crece fuerte.' },
  },
  {
    id: 'pausa-aceptacion',
    kind: 'meditation',
    title: 'Lo que es',
    subtitle: 'Sobre la aceptación',
    description:
      'Aceptar no es resignarse: es dejar de pelear con la realidad para poder responder con claridad. Como abrir el paraguas cuando llueve.',
    categories: ['emociones', 'estres'],
    narrator: 'luz',
    art: { palette: 'rain', motif: 'rain', seed: 502 },
    bed: 'lluvia',
    daily: { theme: 'Aceptación', phrase: 'Acepto lo que es, y desde aquí elijo cómo seguir.' },
  },
  {
    id: 'pausa-soltar',
    kind: 'meditation',
    title: 'Soltar',
    subtitle: 'Abrir la mano',
    description:
      'A veces nos aferramos a ideas, rencores o preocupaciones. Una práctica con las manos abiertas para dejar de cargar lo que no nos toca.',
    categories: ['estres', 'emociones'],
    narrator: 'luz',
    art: { palette: 'sunset', motif: 'waves', seed: 503 },
    bed: 'oceano',
    daily: { theme: 'Soltar', phrase: 'Suelto lo que no puedo sostener, y me quedo con lo esencial.' },
  },
  {
    id: 'pausa-aqui-y-ahora',
    kind: 'meditation',
    title: 'Aquí y ahora',
    subtitle: 'Salir del piloto automático',
    description:
      'Cuando camines, caminá. Cuando comas, comé. Un recorrido por los sentidos para volver al único momento que existe.',
    categories: ['estres', 'enfoque'],
    narrator: 'luz',
    art: { palette: 'mist', motif: 'lake', seed: 504 },
    bed: 'bosque',
    daily: { theme: 'Presencia', phrase: 'Estoy aquí, y esto es suficiente.' },
  },
  {
    id: 'pausa-lo-pequeno',
    kind: 'meditation',
    title: 'Las pequeñas cosas',
    subtitle: 'El arte de saborear',
    description:
      'Lo malo se nos pega, lo bueno resbala. Entrená la mente para saborear los pequeños momentos buenos hasta que dejen huella.',
    categories: ['emociones'],
    narrator: 'luz',
    art: { palette: 'gold', motif: 'sun', seed: 505 },
    bed: 'piano',
    daily: { theme: 'Gratitud', phrase: 'Lo pequeño también es grande, si lo miro.' },
  },
  {
    id: 'pausa-confianza',
    kind: 'meditation',
    title: 'Confianza',
    subtitle: 'Hacer tu parte y soltar el resto',
    description:
      'Tu cuerpo respira, late y sana sin que se lo pidas. Una pausa para confiar en lo que no depende de vos.',
    categories: ['ansiedad', 'estres'],
    narrator: 'luz',
    art: { palette: 'teal', motif: 'beach', seed: 506 },
    bed: 'pad',
    daily: { theme: 'Confianza', phrase: 'Hago mi parte, y confío.' },
  },
  {
    id: 'pausa-amabilidad',
    kind: 'meditation',
    title: 'Amabilidad',
    subtitle: 'Ondas en el lago',
    description:
      'Un gesto amable viaja como las ondas en el agua. Amabilidad en tres direcciones: hacia vos, hacia alguien cercano y hacia el mundo.',
    categories: ['autocompasion'],
    narrator: 'luz',
    art: { palette: 'lavender', motif: 'lake', seed: 507 },
    bed: 'piano',
    daily: { theme: 'Amabilidad', phrase: 'La amabilidad que doy también me transforma.' },
  },
  {
    id: 'pausa-mente-de-principiante',
    kind: 'meditation',
    title: 'Mente de principiante',
    subtitle: 'Mirar con ojos nuevos',
    description:
      'Cuando creemos que ya sabemos cómo es algo, dejamos de verlo. Una pausa para mirar la respiración y el mundo como la primera vez.',
    categories: ['enfoque', 'principiantes'],
    narrator: 'luz',
    art: { palette: 'dawn', motif: 'clouds', seed: 508 },
    bed: 'bosque',
    daily: { theme: 'Curiosidad', phrase: 'Hoy miro con ojos nuevos.' },
  },
  {
    id: 'pausa-todo-pasa',
    kind: 'meditation',
    title: 'Todo pasa',
    subtitle: 'Esto también pasará',
    description:
      'Nada permanece igual: ni el clima, ni las emociones, ni los problemas. Recordarlo aligera lo difícil y hace más presente lo bueno.',
    categories: ['emociones', 'ansiedad'],
    narrator: 'luz',
    art: { palette: 'dusk', motif: 'clouds', seed: 509 },
    bed: 'viento',
    daily: { theme: 'Impermanencia', phrase: 'Esto también pasará.' },
  },
  {
    id: 'pausa-no-hacer',
    kind: 'meditation',
    title: 'El arte de no hacer',
    subtitle: 'Descansar también es avanzar',
    description:
      'Vivimos llenando cada minuto. Una pausa sin metas ni tareas para recordar que el descanso es la base de todo lo demás.',
    categories: ['estres'],
    narrator: 'luz',
    art: { palette: 'mist', motif: 'dunes', seed: 510 },
    bed: 'oceano',
    daily: { theme: 'Descanso', phrase: 'Descansar también es avanzar.' },
  },
  {
    id: 'pausa-empezar-de-nuevo',
    kind: 'meditation',
    title: 'Empezar de nuevo',
    subtitle: 'Cada respiración es un comienzo',
    description:
      'Cada vez que la mente se va y volvés, empezás de nuevo. Una pausa para soltar la autocrítica y dar el siguiente paso.',
    categories: ['autocompasion', 'principiantes'],
    narrator: 'luz',
    art: { palette: 'dawn', motif: 'beach', seed: 511 },
    bed: 'pad',
    daily: { theme: 'Renovación', phrase: 'Siempre puedo empezar de nuevo.' },
  },
  {
    id: 'pausa-bambu',
    kind: 'meditation',
    title: 'Como el bambú',
    subtitle: 'Doblarse sin romperse',
    description:
      'Raíces profundas y un tallo flexible: una pausa sobre la resiliencia, para atravesar las tormentas sin quebrarte.',
    categories: ['estres', 'emociones'],
    narrator: 'luz',
    art: { palette: 'forest', motif: 'bamboo', seed: 512 },
    bed: 'bosque',
    daily: { theme: 'Resiliencia', phrase: 'Me doblo, pero no me rompo.' },
  },

  // ─────────────────────────────── Historias para dormir
  {
    id: 'historia-tren-patagonia',
    kind: 'story',
    title: 'El tren de la Patagonia',
    subtitle: 'Un viaje nocturno por la estepa',
    description:
      'Un tren antiguo cruza despacio la estepa patagónica bajo un cielo enorme. Sopa caliente en el vagón comedor, guanacos al atardecer y el traqueteo que te mece hasta dormir.',
    categories: ['sueno'],
    narrator: 'luz',
    art: { palette: 'dusk', motif: 'train', seed: 601 },
    bed: 'tren',
    sleep: true,
  },
  {
    id: 'historia-faro',
    kind: 'story',
    title: 'La guardiana del faro',
    subtitle: 'Una isla, el mar y una luz que gira',
    description:
      'Cada tarde, Elena sube los ciento veinte escalones del faro para encender la luz que guía a los barcos. Té de manzanilla, olas y un haz que gira toda la noche.',
    categories: ['sueno'],
    narrator: 'luz',
    art: { palette: 'ocean', motif: 'lighthouse', seed: 602 },
    bed: 'faro',
    sleep: true,
  },
  {
    id: 'historia-biblioteca-lluvia',
    kind: 'story',
    title: 'La biblioteca bajo la lluvia',
    subtitle: 'Una tarde de otoño entre libros',
    description:
      'Una biblioteca antigua en un pueblo tranquilo, una bibliotecaria silenciosa, un gato que ronronea y la lluvia que no tiene prisa por terminar.',
    categories: ['sueno'],
    narrator: 'luz',
    art: { palette: 'rain', motif: 'window', seed: 603 },
    bed: 'biblioteca',
    sleep: true,
  },
  {
    id: 'historia-atacama',
    kind: 'story',
    title: 'El cielo de Atacama',
    subtitle: 'Mirar las estrellas en el desierto',
    description:
      'En uno de los cielos más limpios del planeta, una astrónoma te muestra la Cruz del Sur, las Nubes de Magallanes y el río de luz de la Vía Láctea.',
    categories: ['sueno'],
    narrator: 'luz',
    art: { palette: 'desert', motif: 'stars', seed: 604 },
    bed: 'desierto',
    sleep: true,
  },
  {
    id: 'historia-cabana-nieve',
    kind: 'story',
    title: 'Una cabaña en la nieve',
    subtitle: 'Fuego, chocolate caliente y silencio blanco',
    description:
      'Un sendero entre pinos nevados, una cabaña de troncos, el crepitar de la estufa y la nieve que cubre el bosque en silencio.',
    categories: ['sueno'],
    narrator: 'luz',
    art: { palette: 'snow', motif: 'cabin', seed: 605 },
    bed: 'cabana',
    sleep: true,
  },
];

export const SESSIONS: Session[] = SEEDS.filter((s) => audio[s.id]).map((s) => ({
  ...s,
  duration: audio[s.id]!.duration,
}));

export const SESSION_BY_ID: Record<string, Session> = Object.fromEntries(SESSIONS.map((s) => [s.id, s]));

export function audioUrl(id: string): string {
  const v = audio[id]?.v;
  return `/audio/${id}.mp3${v ? `?v=${v}` : ''}`;
}

export function captionsUrl(id: string): string {
  const v = audio[id]?.v;
  return `/captions/${id}.json${v ? `?v=${v}` : ''}`;
}

export const DAILY_POOL = SESSIONS.filter((s) => s.daily);
export const STORIES = SESSIONS.filter((s) => s.kind === 'story');
export const SLEEP_MEDITATIONS = SESSIONS.filter((s) => s.kind === 'meditation' && s.categories.includes('sueno'));

export const PROGRAMS: Program[] = [
  {
    id: 'bajar-un-cambio',
    title: 'Bajar un cambio',
    subtitle: '5 días · 8–10 minutos',
    description:
      'Para cuando estás todo el día resolviendo y hasta descansar te cuesta. Cinco prácticas para salir del piloto automático, frenar la mente acelerada, responderle a la autoexigencia, soltar la culpa y darte permiso para parar.',
    unit: 'Día',
    art: { palette: 'rose', motif: 'beach', seed: 14 },
    sessions: SEEDS.filter((s) => s.program?.id === 'bajar-un-cambio').map((s) => s.id),
    goals: ['estres', 'mente', 'autoexigencia', 'culpa', 'descanso'],
    outcome: 'Menos exigencia, más presencia: herramientas para tu vida real.',
  },
  {
    id: 'aprende-a-meditar',
    title: 'Aprender a meditar',
    subtitle: '7 días · 10 minutos',
    description:
      'El mejor lugar para empezar. En siete sesiones cortas construís, paso a paso, una práctica que podés llevar a cualquier parte: respiración, cuerpo, pensamientos, emociones, sentidos y bondad.',
    unit: 'Día',
    art: { palette: 'dawn', motif: 'sun', seed: 11 },
    sessions: SEEDS.filter((s) => s.program?.id === 'aprende-a-meditar').map((s) => s.id),
    goals: ['aprender', 'estres', 'mente', 'autocuidado'],
    outcome: 'Una práctica propia, en solo diez minutos al día.',
  },
  {
    id: 'calma-la-ansiedad',
    title: 'Calmar la ansiedad',
    subtitle: '5 días · 10 minutos',
    description:
      'Herramientas concretas para entender la ansiedad y responderle con calma: la respiración como interruptor, anclarte en el cuerpo, hacer espacio a las emociones, tomar distancia de los pensamientos y tratarte con cuidado.',
    unit: 'Día',
    art: { palette: 'teal', motif: 'waves', seed: 12 },
    sessions: SEEDS.filter((s) => s.program?.id === 'calma-la-ansiedad').map((s) => s.id),
    goals: ['ansiedad', 'estres'],
    outcome: 'Cinco recursos para usar cuando la ansiedad aparezca.',
  },
  {
    id: 'duerme-profundo',
    title: 'Dormir profundo',
    subtitle: '5 noches · 10–15 minutos',
    description:
      'Cinco prácticas para escuchar ya en la cama, con la luz apagada: soltar el día, respirar para dormir, escaneo corporal, aquietar la mente y un viaje imaginario a un lago en calma.',
    unit: 'Noche',
    art: { palette: 'night', motif: 'moon', seed: 13 },
    sessions: SEEDS.filter((s) => s.program?.id === 'duerme-profundo').map((s) => s.id),
    goals: ['dormir'],
    outcome: 'Un ritual nocturno para dormirte con más facilidad.',
  },
];

export const PROGRAM_BY_ID = Object.fromEntries(PROGRAMS.map((p) => [p.id, p])) as Record<ProgramId, Program>;

export const CATEGORIES: Category[] = [
  {
    id: 'autoexigencia',
    name: 'Autoexigencia',
    blurb: 'Soltar el “tengo que” y tratarte mejor',
    art: { palette: 'rose', motif: 'orb', seed: 30 },
  },
  {
    id: 'ansiedad',
    name: 'Ansiedad',
    blurb: 'Para calmar la alarma interna',
    art: { palette: 'teal', motif: 'waves', seed: 21 },
  },
  { id: 'estres', name: 'Estrés', blurb: 'Soltar la presión del día', art: { palette: 'mist', motif: 'hills', seed: 22 } },
  { id: 'sueno', name: 'Sueño', blurb: 'Descansar y dormir mejor', art: { palette: 'night', motif: 'moon', seed: 23 } },
  {
    id: 'enfoque',
    name: 'Enfoque',
    blurb: 'Claridad para trabajar y estudiar',
    art: { palette: 'ocean', motif: 'mountains', seed: 24 },
  },
  {
    id: 'principiantes',
    name: 'Principiantes',
    blurb: 'Primeros pasos en la meditación',
    art: { palette: 'dawn', motif: 'sun', seed: 25 },
  },
  {
    id: 'emociones',
    name: 'Emociones',
    blurb: 'Entender el clima interior',
    art: { palette: 'plum', motif: 'orb', seed: 26 },
  },
  {
    id: 'autocompasion',
    name: 'Autocompasión',
    blurb: 'Tratarte con amabilidad',
    art: { palette: 'gold', motif: 'hills', seed: 27 },
  },
  { id: 'cuerpo', name: 'Cuerpo', blurb: 'Soltar tensión y habitarte', art: { palette: 'forest', motif: 'path', seed: 28 } },
  { id: 'mananas', name: 'Mañanas', blurb: 'Empezar el día con intención', art: { palette: 'dawn', motif: 'hills', seed: 29 } },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;

export const NARRATORS = {
  luz: { name: 'Luz', note: 'voz neural' },
} as const;

export function sessionKindLabel(s: Session): string {
  if (s.kind === 'story') return 'Historia para dormir';
  if (s.daily) return 'La pausa del día';
  if (s.program) return `${PROGRAM_BY_ID[s.program.id].unit} ${s.program.day}`;
  if (s.sleep) return 'Para dormir';
  return 'Meditación';
}
