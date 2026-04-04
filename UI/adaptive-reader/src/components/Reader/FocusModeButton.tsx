// DONE: Task 7b — Focus mode button
import React from 'react';
import { useUIStore } from '@/store/uiStore';

export const FocusModeButton: React.FC = () => {
  const focusMode = useUIStore(s => s.focusMode);
  const toggleFocusMode = useUIStore(s => s.toggleFocusMode);

  return (
    <button
      className="focus-mode-button"
      onClick={toggleFocusMode}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9000,
        width: '80px',
        height: '32px',
        borderRadius: '16px',
        border: focusMode ? 'none' : '1px solid rgba(24,95,165,0.25)',
        background: focusMode ? 'rgba(24,95,165,0.9)' : 'transparent',
        color: focusMode ? 'white' : 'rgba(24,95,165,0.5)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 200ms ease-out',
        letterSpacing: '0.5px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      Focus
    </button>
  );
};
