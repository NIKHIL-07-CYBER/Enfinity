import React from 'react';

export const StrugglePoint: React.FC<{ quote: string; highlightedWord: string; chapter: string; page: number }> = ({ quote, highlightedWord, chapter, page }) => {
  const parts = highlightedWord ? quote.split(highlightedWord) : [quote];
  
  return (
    <div className="mb-8 border-b pb-8 last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
      <div className="italic text-[17px] mb-5" style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontFamily: 'var(--font-reading)' }}>
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {p}
            {i < parts.length - 1 && (
              <span 
                className="font-semibold cursor-pointer border-b-2 border-opacity-30 hover:border-opacity-100 transition-colors" 
                style={{ color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
              >
                {highlightedWord}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between items-center" style={{ fontFamily: 'var(--font-ui)' }}>
        <span className="text-[10px] tracking-widest font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>
          CHAPTER {chapter}, PAGE {page}
        </span>
        <button className="text-[10px] font-bold uppercase tracking-widest bg-transparent border-none cursor-pointer hover:opacity-80 transition-opacity" style={{ color: 'var(--accent-blue)' }}>
          ADD CONTEXT
        </button>
      </div>
    </div>
  );
};
