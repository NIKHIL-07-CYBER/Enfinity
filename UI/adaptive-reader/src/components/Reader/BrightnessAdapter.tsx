// DONE: Task 8d — Brightness debug adapter
import React from 'react';

export const BrightnessAdapter: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;

  const brightnessData = document.documentElement.getAttribute('data-brightness') || 'N/A';

  return (
    <div style={{
      padding: '4px 8px',
      fontSize: '11px',
      fontFamily: 'ui-monospace, monospace',
      color: 'var(--text-primary)',
      opacity: 0.8,
    }}>
      <span style={{ opacity: 0.6 }}>☀ Brightness: </span>
      {brightnessData}
    </div>
  );
};
