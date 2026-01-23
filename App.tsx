import React from 'react';
import Hero from './components/Hero';
import ValueProps from './components/ValueProps';
import Proof from './components/Proof';
import FooterCTA from './components/FooterCTA';
import Background from './components/Background';
import { Layers } from 'lucide-react';

const App: React.FC = () => {
  const handleCtaClick = () => {
    window.open('https://calendly.com/axellaban/15min', '_blank');
  };

  return (
    <div className="min-h-screen text-white selection:bg-primary/50">
      <Background />
      
      {/* Navigation - Transparent, friendly */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-brand-blue/80 backdrop-blur-md shadow-sm border-b border-white/10"></div>
        <div className="relative max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight">
            <div className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center transform -rotate-6 transition-transform hover:rotate-0">
              <Layers className="w-6 h-6 text-brand-blue" />
            </div>
            <span className="text-white drop-shadow-sm">MindFlow</span>
          </div>
          <button 
            onClick={handleCtaClick}
            className="text-sm font-bold text-white hover:text-primary transition-colors bg-white/10 px-4 py-2 rounded-full hover:bg-white/20"
          >
            Agendar Demo
          </button>
        </div>
      </nav>

      <main className="relative">
        <Hero onCtaClick={handleCtaClick} />
        <ValueProps />
        <Proof />
        <FooterCTA />
      </main>
    </div>
  );
};

export default App;