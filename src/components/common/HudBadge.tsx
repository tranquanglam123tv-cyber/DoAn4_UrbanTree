import React from 'react';
import { Sparkles } from 'lucide-react';

interface HudBadgeProps {
  label: string;
  className?: string;
}

export const HudBadge: React.FC<HudBadgeProps> = ({ label, className = '' }) => {
  return (
    <div className={`hero-badge-anim ${className}`}>
      {/* 4 Chấm Vuông Nở Bung Góc */}
      <div className="rect-container">
        <span className="rectangle tl" />
        <span className="rectangle bl" />
        <span className="rectangle br" />
        <span className="rectangle tr" />
      </div>

      <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
      <span className="badge-content">{label}</span>
      <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
    </div>
  );
};

