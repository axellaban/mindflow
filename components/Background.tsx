import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-brand-blue">
      {/* Abstract Cloud Shapes - Soft white overlays */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-white/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-secondary/20 rounded-full blur-3xl animate-float-delayed" />
      
      {/* Decorative Vector-like Elements (CSS Shapes) */}
      <div className="absolute top-[15%] right-[15%] opacity-20">
         {/* Small sparkles or circles */}
         <div className="absolute w-4 h-4 bg-primary rounded-full top-0 left-0 animate-pulse"></div>
         <div className="absolute w-2 h-2 bg-white rounded-full top-10 left-12"></div>
         <div className="absolute w-6 h-6 bg-secondary rounded-full top-20 -left-10 opacity-60"></div>
      </div>
    </div>
  );
};

export default Background;