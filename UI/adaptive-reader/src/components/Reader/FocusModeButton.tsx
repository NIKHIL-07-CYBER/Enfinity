// DONE: Task 7b — Focus mode button (enhanced: paragraph-opacity control)
import React from 'react';
import { useUIStore } from '@/store/uiStore';

export const FocusModeButton: React.FC = () => {
  const focusMode = useUIStore(s => s.focusMode);
  const toggleFocusMode = useUIStore(s => s.toggleFocusMode);

  return (
    <button
      className="focus-mode-button"
      onClick={toggleFocusMode}
      title={focusMode ? 'Exit Focus Mode (Ctrl+Shift+F)' : 'Enter Focus Mode — dims non-active paragraphs (Ctrl+Shift+F)'}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9000,
        width: '80px',
        height: '32px',
        borderRadius: '16px',
        border: focusMode ? 'none' : '1px solid var(--border-color)',
        background: focusMode ? 'var(--accent-blue)' : 'transparent',
        color: focusMode ? 'var(--toolbar-on-accent)' : 'var(--accent-blue)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 200ms ease-out',
        letterSpacing: '0.5px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {focusMode ? '✦ Focus' : 'Focus'}
    </button>
  );
};

