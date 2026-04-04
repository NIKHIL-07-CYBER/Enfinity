import React from 'react';
import { motion } from 'framer-motion';
import { Paragraph } from '@/types';

export const ParagraphBlock: React.FC<{ paragraph: Paragraph; isActive: boolean }> = ({ paragraph, isActive }) => {
  const isQuote = paragraph.text.startsWith('"');

  return (
    <motion.div
      data-paragraph-id={paragraph.id}
      initial={false}
      animate={{ 
        opacity: isActive ? 1 : 0.45,
        backgroundColor: isActive && !isQuote ? 'rgba(24, 95, 165, 0.04)' : 'transparent'
      }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className={`mb-8 p-4 rounded ${isQuote ? 'border-l-[3px] pl-6' : ''}`}
      style={{ 
        borderColor: isQuote ? 'var(--accent-blue)' : 'transparent',
        backgroundColor: isQuote ? 'var(--accent-blue-light)' : undefined,
      }}
    >
      <p style={{ fontWeight: 'var(--font-weight)', lineHeight: 'var(--line-height)' }}>
        {paragraph.text}
      </p>
    </motion.div>
  );
};
