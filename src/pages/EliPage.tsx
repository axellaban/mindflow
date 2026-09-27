import { CalendarHeart, Check, Laptop, Leaf, Quote, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { Words } from '@/components/ui/Words';
import { ELI, nextEvent } from '@/content/eli';
import { goalsPhrase } from '@/content/goals';
import { EliAvatar } from '@/features/eli/EliAvatar';
import { EliEventCard } from '@/features/eli/EliHomeCard';
import { EliPrimaryLink, EliSecondaryLink, InstagramIcon, WhatsAppIcon, useEliLinks } from '@/features/eli/actions';
import { EASE_BREATH, breath } from '@/lib/motion';
import { useAppStore } from '@/store/app';
import { PageHeader } from './PageHeader';

const rise = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
};

const FORMAT = [
  { icon: <Laptop className="size-4.5" />, title: 'Online', text: 'Desde donde estés, en el horario que elijas.' },
  { icon: <Sparkles className="size-4.5" />, title: 'A tu medida', text: 'Partimos de lo que te está pasando a vos.' },
  { icon: <Leaf className="size-4.5" />, title: 'Para tu vida real', text: 'Prácticas simples que podés llevar a tu día.' },
];

/** Eli's page inside the app: who she is, how a 1:1 session works and how to book. */
export function EliPage() {
  const links = useEliLinks('eli-page');
  const goals = useAppStore((s) => s.profile.goals);
  const struggle = goalsPhrase(goals, 2);
  const event = nextEvent();

  useEffect(() => useAppStore.getState().markEliSeen('eli-page'), []);

  const ctas = (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      <EliPrimaryLink href={links.booking} onClick={() => links.track('book')} icon={<CalendarHeart className="relative size-4.5" />} className="h-13 px-7 text-[16px]">
        Agendar mi sesión
      </EliPrimaryLink>
      <EliSecondaryLink href={links.whatsapp('sessions')} onClick={() => links.track('whatsapp')} icon={<WhatsAppIcon className="size-4.5" />}>
        Consultame por WhatsApp
      </EliSecondaryLink>
    </div>
  );

  return (
    <div className="pb-16">
      <PageHeader title="" back />

      <section className="px-5 md:grid md:grid-cols-[minmax(0,300px)_1fr] md:items-center md:gap-12 md:px-0">
        <Portrait />
        <motion.div {...rise} className="mt-10 md:mt-0">
          <p className="text-[12px] font-bold tracking-[0.16em] text-blush-300 uppercase">Sesiones 1:1 online</p>
          <h1 className="mt-2 font-display text-[42px] leading-[1.02] md:text-[56px]">
            <Words text="Hola, soy Eli" delay={0.15} />
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-2">
            Acompaño a mujeres que están todo el día resolviendo, pensando en lo que sigue, y a las que incluso descansar les cuesta.
          </p>
          <p className="mt-3 text-[16px] leading-relaxed text-2">{ELI.approach}</p>
          {struggle && (
            <p className="mt-4 rounded-2xl border border-blush-300/20 bg-blush-300/8 px-4 py-3 text-[15px] leading-relaxed">
              ¿Te está costando {struggle}? Es de lo que más trabajo con mujeres en las sesiones.
            </p>
          )}
          <div className="mt-6">{ctas}</div>
        </motion.div>
      </section>

      <motion.section {...rise} className="mt-14 px-5 md:px-0">
        <h2 className="font-display text-[26px] leading-tight">¿Qué podemos trabajar juntas?</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {ELI.topics.map((t, i) => (
            <motion.span
              key={t}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[14.5px] font-medium"
            >
              {t}
            </motion.span>
          ))}
        </div>
      </motion.section>

      <motion.section {...rise} className="mt-12 px-5 md:px-0">
        <h2 className="font-display text-[26px] leading-tight">Cómo es una sesión</h2>
        <div className="glass mt-4 divide-y divide-white/6 rounded-[28px] px-5 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-0">
          {FORMAT.map((f) => (
            <div key={f.title} className="flex items-start gap-3.5 py-4 sm:flex-col sm:px-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blush-300/15 text-blush-300">{f.icon}</span>
              <span>
                <span className="block text-[16px] font-semibold">{f.title}</span>
                <span className="mt-0.5 block text-[14px] leading-relaxed text-2">{f.text}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section {...rise} className="mt-12 px-5 md:px-0">
        <h2 className="font-display text-[26px] leading-tight">Reservar es simple</h2>
        <ol className="mt-5 space-y-4">
          {ELI.steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blush-300 to-gold-300 font-display text-[18px] font-semibold text-ink-900">
                {i + 1}
              </span>
              <span className="pt-1">
                <span className="block text-[16px] font-semibold">{s.title}</span>
                <span className="block text-[14px] leading-relaxed text-2">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </motion.section>

      <motion.section {...rise} className="mt-12">
        <h2 className="px-5 font-display text-[26px] leading-tight md:px-0">Lo que dicen quienes practicaron con Eli</h2>
        {/* focusable so the row can also be scrolled from the keyboard */}
        <div
          className="no-scrollbar snap-row mt-4 flex gap-3 overflow-x-auto px-5 pb-2 md:grid md:grid-cols-3 md:px-0"
          tabIndex={0}
          role="region"
          aria-label="Testimonios"
        >
          {ELI.testimonials.map((t) => (
            <figure key={t} className="glass w-[78%] shrink-0 rounded-3xl p-5 md:w-auto">
              <Quote className="size-5 text-blush-300" />
              <blockquote className="mt-3 font-display text-[21px] leading-snug italic">“{t}”</blockquote>
              <figcaption className="mt-3 text-[12.5px] text-3">Participante de un encuentro con Eli</figcaption>
            </figure>
          ))}
        </div>
      </motion.section>

      {event && (
        <motion.section {...rise} className="mt-12 px-5 md:px-0 lg:max-w-2xl">
          <h2 className="mb-4 font-display text-[26px] leading-tight">Próximo encuentro</h2>
          <EliEventCard event={event} placement="eli-page" dismissible={false} />
        </motion.section>
      )}

      <motion.section {...rise} className="mt-12 px-5 md:px-0">
        <h2 className="font-display text-[26px] leading-tight">Sobre Eli</h2>
        <ul className="mt-4 space-y-2.5">
          {ELI.credentials.map((c) => (
            <li key={c} className="flex gap-3 text-[15px] leading-relaxed text-2">
              <Check className="mt-1 size-4 shrink-0 text-sage-300" strokeWidth={3} />
              {c}
            </li>
          ))}
        </ul>
        <a
          href={ELI.instagram}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => links.track('instagram')}
          className="mt-4 inline-flex items-center gap-2 text-[14.5px] font-semibold text-blush-300 transition-colors hover:text-mist-50"
        >
          <InstagramIcon className="size-4.5" /> {ELI.handle}
        </a>
      </motion.section>

      <motion.section
        {...rise}
        className="relative mx-5 mt-14 overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(140deg,rgb(168_220_213/0.2),rgb(246_222_175/0.09)_50%,rgb(195_230_223/0.1))] p-6 md:mx-0 md:p-9"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-blush-400/25 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <EliAvatar size={44} />
          <p className="font-display text-[20px] font-semibold text-blush-300 italic">Eli</p>
        </div>
        <h2 className="relative mt-4 font-display text-[30px] leading-tight">¿Lista para empezar?</h2>
        <p className="relative mt-2 max-w-md text-[15.5px] leading-relaxed text-2">
          Elegí el día y el horario que te queden cómodos. Si tenés alguna duda antes de reservar, escribime y lo charlamos.
        </p>
        <div className="relative mt-6">{ctas}</div>
      </motion.section>
    </div>
  );
}

/** Eli's portrait with a breathing glow and a few leaves drifting around it. */
function Portrait() {
  const reduced = useReducedMotion();
  const leaves = [
    { left: '-6%', top: '12%', size: 12, dur: 7, delay: 0 },
    { left: '92%', top: '6%', size: 9, dur: 8.5, delay: 1.2 },
    { left: '96%', top: '58%', size: 13, dur: 9, delay: 0.6 },
    { left: '-10%', top: '70%', size: 8, dur: 7.8, delay: 2 },
    { left: '40%', top: '-5%', size: 7, dur: 10, delay: 0.3 },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-60 md:w-full"
    >
      <motion.div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[56px] bg-[radial-gradient(closest-side,rgb(168_220_213/0.42),rgb(246_222_175/0.16),transparent)] blur-2xl"
        animate={reduced ? undefined : { opacity: [0.6, 1, 0.6], scale: [0.96, 1.04, 0.96] }}
        transition={breath}
      />
      <img
        src={ELI.photo}
        alt={ELI.fullName}
        className="relative aspect-[4/5] w-full -rotate-2 rounded-[36px] border border-white/15 object-cover shadow-[0_40px_80px_-30px_rgb(2_38_48/0.75)]"
      />
      {leaves.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute rounded-[60%_40%_60%_40%] bg-gradient-to-br from-mist-50 to-blush-400"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size * 0.7 }}
          animate={reduced ? undefined : { y: [0, -10, 0], rotate: [0, 18, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: p.dur * 1.4, delay: p.delay, repeat: Infinity, ease: EASE_BREATH }}
        />
      ))}
    </motion.div>
  );
}
