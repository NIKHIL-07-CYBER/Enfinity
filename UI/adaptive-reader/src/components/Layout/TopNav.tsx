// DONE: Task 1a/1b/1c/1d — Fix all navbar buttons and links
import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useScrollVelocity } from '@/hooks/useScrollVelocity';
import { useUIStore } from '@/store/uiStore';

export const TopNav: React.FC = () => {
  const { direction } = useScrollVelocity();
  const hidden = direction === 'down';
  const navigate = useNavigate();
  const chromeOpacity = useUIStore(s => s.chromeOpacity);
  const burstActive = useUIStore(s => s.burstActive);

  return (
    <motion.nav
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`chrome-shell fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-5 border-b bg-white ${burstActive ? 'chrome-burst' : ''}`}
      style={{
        backgroundColor: 'var(--bg-color)',
        borderColor: 'var(--card-border)',
        pointerEvents: hidden ? 'none' : 'auto',
        opacity: chromeOpacity,
        transition: chromeOpacity === 0 ? 'opacity 400ms ease-out' : 'none',
        zIndex: 1000,
      }}
    >
      <div
        className="flex-1 font-bold text-xl cursor-pointer"
        style={{ color: 'var(--text-color)' }}
        onClick={() => navigate(ROUTES.upload)}
      >
        The Manuscript
      </div>
      
      <div className="flex space-x-10">
        <Link
          to={ROUTES.upload}
          className="text-sm tracking-widest font-medium uppercase transition-colors"
          style={{ color: 'var(--nav-text)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--nav-text)'}
        >LIBRARY</Link>
        <Link
          to={ROUTES.archive}
          className="text-sm tracking-widest font-medium uppercase transition-colors"
          style={{ color: 'var(--nav-text)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--nav-text)'}
        >ARCHIVE</Link>
        <Link
          to={ROUTES.saved}
          className="text-sm tracking-widest font-medium uppercase transition-colors"
          style={{ color: 'var(--nav-text)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--nav-text)'}
        >SAVED</Link>
      </div>

      <div className="flex-1 flex justify-end gap-3">
        <button
          onClick={() => navigate(ROUTES.settings)}
          className="p-2 cursor-pointer transition-colors"
          aria-label="Settings"
          style={{ color: 'var(--text-color)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-blue)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-color)'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </motion.nav>
  );
};
