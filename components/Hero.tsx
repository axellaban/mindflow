import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroProps {
  onCtaClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  return (
    <section className="relative pt-32 pb-32 md:pt-48 md:pb-48 px-6 flex flex-col items-center justify-center text-center z-10 overflow-hidden">
      
      {/* Abstract CSS Art: The Arch (Reference to the MindTune image) */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/10 rounded-t-full -z-10 pointer-events-none blur-sm" />
      <div className="absolute bottom-[-50px] left-1/2 -translate-x-1/2 w-[400px] h-[250px] bg-indigo-500/20 rounded-t-full -z-10 pointer-events-none" />

      {/* Badge Hook */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-8 animate-float shadow-sm">
        <span className="flex h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_#FFC805]"></span>
        <span className="text-sm font-bold text-white tracking-wide">
          IA para Instructores de Mindfulness
        </span>
      </div>

      {/* Main Heading */}
      <h1 className="max-w-4xl mx-auto text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1] drop-shadow-sm">
        Deja de administrar. <br />
        <span className="text-primary relative inline-block">
          Empieza a escalar.
          {/* Underline decoration */}
          <svg className="absolute w-full h-3 -bottom-1 left-0 text-white opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none">
             <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
          </svg>
        </span>
      </h1>

      {/* Subtext */}
      <p className="max-w-2xl mx-auto text-xl text-white/90 font-medium mb-10 leading-relaxed">
        Tu negocio no crece porque pasas el día gestionando reservas.
        Implementamos sistemas que te llevan a 6 cifras sin burnout.
      </p>

      {/* Primary CTA */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <button 
          onClick={onCtaClick}
          className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-primary px-10 font-bold text-brand-dark shadow-[0_4px_14px_0_rgba(255,200,5,0.39)] transition-all duration-300 hover:scale-105 hover:shadow-[0_6px_20px_rgba(255,200,5,0.23)] active:scale-95"
        >
          <span className="mr-2 text-lg">Ver Demo de 2 Minutos</span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
        
        <p className="text-sm text-white/80 font-medium mt-4 sm:mt-0 sm:ml-4 bg-white/10 px-4 py-2 rounded-full">
          ✨ Sin registro • Acceso instantáneo
        </p>
      </div>
      
      {/* Decorative cloud bottom */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-20">
        <svg className="relative block w-[calc(100%+1.3px)] h-[60px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#FFFFFF" fillOpacity="0.1"></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;