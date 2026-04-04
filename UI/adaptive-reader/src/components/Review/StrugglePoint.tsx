import React from 'react';

export const StrugglePoint: React.FC<{ quote: string; highlightedWord: string; chapter: string; page: number }> = ({ quote, highlightedWord, chapter, page }) => {
  const parts = quote.split(highlightedWord);
  
  return (
    <div className="mb-8 border-b pb-8 last:border-b-0" style={{ borderColor: 'var(--card-border)' }}>
      <div className="italic text-lg mb-5" style={{ color: 'var(--text-color)', lineHeight: '1.6' }}>
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {p}
            {i < parts.length - 1 && (
              <span className="font-semibold cursor-pointer border-b-2 border-opacity-30 hover:border-opacity-100 transition-colors" style={{ color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}>
                {highlightedWord}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[11px] tracking-widest font-bold uppercase" style={{ color: 'var(--nav-text)' }}>
          CHAPTER {chapter}, PAGE {page}
        </span>
        <button className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-blue)' }}>
          ADD CONTEXT
        </button>
      </div>
    </div>
  );
};
