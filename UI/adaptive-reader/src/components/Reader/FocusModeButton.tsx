// Feature 3: Zero-Chrome Focus Mode Button
// In zero-chrome mode: auto-fades after 2s of no mouse movement, mouse near
// bottom-right corner brings it back, shows "×" to exit.
import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';

export const FocusModeButton: React.FC = () => {
  const focusMode = useUIStore(s => s.focusMode);
  const zeroChrome = useUIStore(s => s.zeroChrome);
  const enterZeroChrome = useUIStore(s => s.enterZeroChrome);
  const exitZeroChrome = useUIStore(s => s.exitZeroChrome);
  const showExitHint = useUIStore(s => s.showExitHint);

  const [visible, setVisible] = useState(true);
  const hideTimerRef = useRef<number | undefined>(undefined);

  // In zero-chrome mode, auto-hide after 2s of no mouse movement
  useEffect(() => {
    if (!zeroChrome) {
      setVisible(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const nearCorner =
        e.clientX > window.innerWidth - 150 &&
        e.clientY > window.innerHeight - 150;

      if (nearCorner || !zeroChrome) {
        setVisible(true);
      }

      // Reset hide timer
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        if (zeroChrome) setVisible(false);
      }, 2000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Initial hide after 2s
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [zeroChrome]);

  const handleClick = () => {
    if (zeroChrome) {
      exitZeroChrome();
    } else {
      enterZeroChrome();
    }
  };

  return (
    <>
      {/* Exit hint overlay */}
      <AnimatePresence>
        {showExitHint && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9900,
              padding: '16px 28px',
              borderRadius: '14px',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.3px',
              pointerEvents: 'none',
              textAlign: 'center',
            }}
          >
            Press <kbd style={{
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: '12px',
              fontFamily: 'inherit',
              fontWeight: 600,
            }}>Esc</kbd> or move mouse to corner to exit
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus/Exit button */}
      <AnimatePresence>
        {visible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="focus-mode-button"
            onClick={handleClick}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 9000,
              width: zeroChrome ? '40px' : '80px',
              height: zeroChrome ? '40px' : '32px',
              borderRadius: zeroChrome ? '50%' : '16px',
              border: zeroChrome
                ? '1px solid rgba(255,255,255,0.2)'
                : focusMode
                  ? 'none'
                  : '1px solid var(--border-color)',
              background: zeroChrome
                ? 'rgba(0, 0, 0, 0.5)'
                : focusMode
                  ? 'var(--accent-blue)'
                  : 'transparent',
              color: zeroChrome
                ? '#fff'
                : focusMode
                  ? 'var(--toolbar-on-accent)'
                  : 'var(--accent-blue)',
              fontSize: zeroChrome ? '18px' : '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms ease-out',
              letterSpacing: '0.5px',
              backdropFilter: zeroChrome ? 'blur(8px)' : 'none',
              WebkitBackdropFilter: zeroChrome ? 'blur(8px)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {zeroChrome ? '×' : 'Focus'}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
