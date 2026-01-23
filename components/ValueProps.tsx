import React from 'react';
import SpotlightCard from './ui/SpotlightCard';
import { Bot, Users, Zap, ShieldCheck } from 'lucide-react';

const ValueProps: React.FC = () => {
  const features = [
    {
      title: "Captación Automática",
      description: "Nuestro sistema de IA interactúa con prospectos en Instagram y Email 24/7, agendando clases mientras duermes.",
      icon: <Bot className="w-8 h-8 text-white" />,
      color: "bg-blue-500",
      stat: "+40% Conversión"
    },
    {
      title: "Retención Personalizada",
      description: "Check-ins automáticos que se sienten humanos. Reduce el churn manteniendo a tus estudiantes motivados.",
      icon: <Users className="w-8 h-8 text-white" />,
      color: "bg-secondary", // Pink
      stat: "x2 LTV de Alumno"
    },
    {
      title: "Operaciones Invisibles",
      description: "Pagos, recordatorios y reprogramaciones gestionados sin que muevas un dedo. Recupera 20 horas a la semana.",
      icon: <Zap className="w-8 h-8 text-brand-dark" />,
      color: "bg-primary", // Yellow
      stat: "-20hrs Admin/sem"
    }
  ];

  return (
    <section className="py-24 px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-20 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6 drop-shadow-md">
            El Sistema Operativo para <br/> Instructores Modernos
          </h2>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            No necesitas más marketing. Necesitas mejores sistemas. 
            Transformamos tu caos en crecimiento predecible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <SpotlightCard key={index} className="h-full">
              <div className="p-8 h-full flex flex-col items-start">
                <div className={`mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl ${feature.color} shadow-lg transform -rotate-3`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-brand-dark mb-4">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-8 flex-grow">
                  {feature.description}
                </p>
                <div className="pt-6 w-full border-t border-slate-100 mt-auto">
                  <div className="flex items-center justify-between text-sm font-bold text-brand-blue">
                    <span className="flex items-center">
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      Resultado Probado
                    </span>
                    <span className="bg-blue-50 px-3 py-1 rounded-full">{feature.stat}</span>
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

export default ValueProps;