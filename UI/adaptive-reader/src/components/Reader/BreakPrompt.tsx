import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BreakPromptProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const BreakPrompt: React.FC<BreakPromptProps> = ({ isVisible, onDismiss }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50 pointer-events-auto flex items-start gap-4"
          style={{
            backgroundColor: 'var(--toast-bg)',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <span style={{ fontSize: '15px' }} className="flex-1 mt-0.5">
            20-min check — look 20ft away for 20 seconds 👁
          </span>
          <button 
            onClick={onDismiss}
            className="opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
