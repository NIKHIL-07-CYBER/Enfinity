import React from 'react';

export const TermCard: React.FC<{ category: string; term: string; definition: string }> = ({ category, term, definition }) => {
  return (
    <div 
      className="p-5 rounded-xl border flex flex-col hover-lift transition-all" 
      style={{ 
        borderColor: 'var(--border-color)', 
        background: 'var(--bg-primary)' 
      }}
    >
      <div className="flex justify-between items-start mb-4 text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}>
        <span>{category}</span>
        <span>☆</span>
      </div>
      <div className="font-bold text-xl mb-2" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-reading)', letterSpacing: '-0.01em' }}>
        {term}
      </div>
      <div className="italic text-[15px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-reading)' }}>
        "{definition}"
      </div>
    </div>
  );
};
