import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Star } from 'lucide-react';

const FooterCTA: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const openCalendly = () => {
    window.open('https://calendly.com/axellaban/15min', '_blank');
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Final Static CTA Section - Pink Background */}
      <section className="py-32 px-6 relative z-10 overflow-hidden bg-secondary">
         {/* Wave Divider Top */}
         <div className="absolute top-0 left-0 w-full overflow-hidden leading-none">
            <svg className="relative block w-[calc(100%+1.3px)] h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#6B8AF8"></path>
            </svg>
         </div>

         {/* Decorative elements */}
         <div className="absolute right-[10%] top-[30%] w-16 h-16 text-white opacity-40">
            <Star className="w-full h-full fill-current" />
         </div>
         <div className="absolute left-[10%] bottom-[20%] w-10 h-10 text-white opacity-40">
            <Star className="w-full h-full fill-current" />
         </div>

        <div className="max-w-4xl mx-auto text-center relative pt-10">
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-brand-dark mb-8">
            Escala tu impacto.<br/>Sin sacrificar tu paz.
          </h2>
          <p className="text-lg text-slate-800 font-medium mb-10 max-w-xl mx-auto">
            Te ayudamos a implementar el sistema completo en 30 días o te devolvemos tu inversión.
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={openCalendly}
              className="group h-16 px-10 rounded-full bg-brand-dark text-white font-bold text-xl shadow-xl hover:bg-black transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
            >
              Agendar Auditoría Gratuita
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform text-primary" />
            </button>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-slate-800">
               <span className="flex items-center gap-2 bg-white/30 px-3 py-1 rounded-full"><Check className="w-4 h-4 text-green-600" /> Garantía 100%</span>
               <span className="flex items-center gap-2 bg-white/30 px-3 py-1 rounded-full"><Check className="w-4 h-4 text-green-600" /> Sin contratos largos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Bar CTA */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg transition-all duration-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
      >
        <button 
          onClick={openCalendly}
          className="w-full bg-brand-dark/95 backdrop-blur-md text-white px-8 py-4 rounded-full shadow-2xl flex items-center justify-between group border border-white/10 hover:bg-black transition-all"
        >
          <span className="font-bold text-lg">Agendar Demo 1:1</span>
          <span className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
            <ArrowRight className="w-5 h-5" />
          </span>
        </button>
      </div>
    </>
  );
};

export default FooterCTA;
