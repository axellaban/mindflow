import React from 'react';
import SpotlightCard from './ui/SpotlightCard';

const Proof: React.FC = () => {
  const testimonials = [
    {
      name: "Sofía R.",
      role: "Instructora de Yoga",
      company: "Mindful Space",
      image: "https://picsum.photos/100/100?random=1",
      text: "Antes pasaba 3 horas al día en DMs. MindFlow automatizó todo. Ahora tengo lista de espera y trabajo la mitad.",
      bg: "bg-blue-50"
    },
    {
      name: "Carlos M.",
      role: "Coach de Meditación",
      company: "Zen Flow",
      image: "https://picsum.photos/100/100?random=2",
      text: "La herramienta de retención es increíble. Mis alumnos reciben mensajes personalizados. La tasa de abandono cayó un 60%.",
      bg: "bg-pink-50"
    },
    {
      name: "Elena T.",
      role: "Fundadora",
      company: "Breathing Lab",
      image: "https://picsum.photos/100/100?random=3",
      text: "Escéptica al principio, pero MindFlow entiende el tono perfectamente. Es como tener un asistente experto 24/7.",
      bg: "bg-yellow-50"
    },
    {
      name: "Marco P.",
      role: "Facilitador",
      company: "Inner Growth",
      image: "https://picsum.photos/100/100?random=4",
      text: "Dupliqué mis ingresos en 2 meses. El sistema hace el seguimiento de leads que yo olvidaba. El ROI es absurdo.",
      bg: "bg-indigo-50"
    }
  ];

  return (
    <section className="py-24 px-6 relative z-10">
      {/* Curved Divider Top */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#FFFFFF" fillOpacity="0.1"></path>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-16 text-center drop-shadow-sm">
          Lo que dicen nuestros instructores.
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <SpotlightCard key={i} className={`border-none ${t.bg}`}>
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-1 bg-white rounded-full shadow-sm">
                    <img src={t.image} alt={t.name} className="w-10 h-10 rounded-full" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{t.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{t.company}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  "{t.text}"
                </p>
                {/* Decoration */}
                <div className="mt-auto pt-4 flex justify-end">
                   <div className="flex gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                     <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                   </div>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Proof;