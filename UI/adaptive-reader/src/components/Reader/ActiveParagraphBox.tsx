// DONE: Task 2c — Active paragraph floating indicator
import React from 'react';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useSessionStore } from '@/store/sessionStore';

export const ActiveParagraphBox: React.FC = () => {
  const activeParagraphId = useTelemetryStore(s => s.activeParagraphId);
  const paragraphs = useSessionStore(s => s.paragraphs);

  if (!activeParagraphId || !paragraphs.length) return null;

  const currentIndex = paragraphs.findIndex(p => p.id === activeParagraphId);
  if (currentIndex === -1) return null;

  const progress = ((currentIndex + 1) / paragraphs.length) * 100;

  return (
    <div
      className="active-paragraph-box"
      style={{
        position: 'fixed',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '48px',
        background: 'rgba(24,95,165,0.08)',
        borderRadius: '8px',
        padding: '6px 4px',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '10px',
        color: 'rgba(24,95,165,0.7)',
        textAlign: 'center',
        zIndex: 900,
        pointerEvents: 'none',
        transition: 'opacity 500ms ease-out',
      }}
    >
      <div style={{ marginBottom: '4px', fontWeight: 600 }}>
        ¶ {currentIndex + 1}
      </div>
      <div style={{ fontSize: '8px', opacity: 0.7, marginBottom: '4px' }}>
        / {paragraphs.length}
      </div>
      <div style={{
        width: '100%',
        height: '3px',
        background: 'rgba(24,95,165,0.12)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'rgba(24,95,165,0.5)',
          borderRadius: '2px',
          transition: 'width 300ms ease-out',
        }} />
      </div>
    </div>
  );
};
