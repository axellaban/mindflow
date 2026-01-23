import React from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string; // Kept for prop compatibility but unused in this design
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-white text-text shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${className}`}
    >
      <div className="relative h-full">{children}</div>
    </div>
  );
};

export default SpotlightCard;