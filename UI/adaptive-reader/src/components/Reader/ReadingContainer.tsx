import React from 'react';
import { Paragraph } from '@/types';
import { ParagraphBlock } from './ParagraphBlock';

export const ReadingContainer: React.FC<{ paragraphs: Paragraph[] }> = ({ paragraphs }) => {
  return (
    <div className="w-full max-w-[680px] mx-auto px-12 py-32">
      <div className="mb-12">
        <div style={{ color: 'var(--nav-text)' }} className="text-xs uppercase tracking-widest font-bold mb-4">
          CHAPTER 04 • 12 MIN READ • WORD COUNT: {paragraphs.reduce((acc, p) => acc + p.wordCount, 0).toLocaleString()}
        </div>
        <h1 style={{ fontWeight: 700 }} className="text-4xl leading-tight mb-16">
          The Architecture of Silence
        </h1>
      </div>
      
      <div className="flex flex-col">
        {paragraphs.map((p, idx) => (
          <ParagraphBlock key={p.id} paragraph={p} isActive={idx === 0 || idx === 1 || idx === 2} /> 
        ))}
      </div>
    </div>
  );
};
