import React from 'react';

interface HudBadgeProps {
  label: string;
  className?: string;
}

export const HudBadge: React.FC<HudBadgeProps> = ({ label, className = '' }) => {
  return (
    <div
      className={`inline-flex items-center justify-center px-4 sm:px-5 py-1.5 rounded-full bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-xs font-bold tracking-wider uppercase shadow-xs backdrop-blur-md transition-all hover:scale-[1.01] select-none ${className}`}
    >
      <span>{label}</span>
    </div>
  );
};

