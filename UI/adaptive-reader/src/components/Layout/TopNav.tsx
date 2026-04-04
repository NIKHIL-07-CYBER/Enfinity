import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { useScrollVelocity } from '@/hooks/useScrollVelocity';

export const TopNav: React.FC = () => {
  const { direction } = useScrollVelocity();
  const hidden = direction === 'down';

  return (
    <motion.nav
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-5 border-b bg-white"
      style={{
        backgroundColor: 'var(--bg-color)',
        borderColor: 'var(--card-border)',
        pointerEvents: hidden ? 'none' : 'auto'
      }}
    >
      <div className="flex-1 font-bold text-xl" style={{ color: 'var(--text-color)' }}>
        The Manuscript
      </div>
      
      <div className="flex space-x-10">
        <Link to="#" className="text-sm tracking-widest font-medium uppercase transition-colors" style={{ color: 'var(--nav-text)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--nav-text)'}>LIBRARY</Link>
        <Link to="#" className="text-sm tracking-widest font-medium uppercase transition-colors" style={{ color: 'var(--nav-text)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--nav-text)'}>ARCHIVE</Link>
        <Link to="#" className="text-sm tracking-widest font-medium uppercase transition-colors" style={{ color: 'var(--nav-text)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--nav-text)'}>NOTES</Link>
      </div>

      <div className="flex-1 flex justify-end">
        <button className="p-2 cursor-pointer transition-colors" aria-label="Menu" style={{ color: 'var(--text-color)' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-color)'}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    </motion.nav>
  );
};
