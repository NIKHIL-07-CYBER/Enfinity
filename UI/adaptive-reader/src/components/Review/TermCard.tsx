import React from 'react';

export const TermCard: React.FC<{ category: string; term: string; definition: string }> = ({ category, term, definition }) => {
  return (
    <div className="p-5 rounded-xl border flex flex-col bg-white" style={{ borderColor: 'var(--card-border)' }}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-[11px] tracking-widest font-bold uppercase" style={{ color: 'var(--nav-text)' }}>
          {category}
        </span>
        <span style={{ color: 'var(--nav-text)' }}>☆</span>
      </div>
      <div className="font-bold text-xl mb-2" style={{ color: 'var(--text-color)' }}>
        {term}
      </div>
      <div className="italic text-[15px]" style={{ color: 'var(--nav-text)' }}>
        "{definition}"
      </div>
    </div>
  );
};
