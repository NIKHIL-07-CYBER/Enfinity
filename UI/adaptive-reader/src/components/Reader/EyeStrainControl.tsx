import React, { useEffect, useState } from 'react';
import { applyEyeStrainSettings, type EyeStrainLevel } from '@/utils/eyeStrain';

const LEVELS: { value: EyeStrainLevel; label: string }[] = [
  { value: 'low', label: 'Low Strain' },
  { value: 'medium', label: 'Medium Strain' },
  { value: 'high', label: 'High Strain' },
];

export const EyeStrainControl: React.FC = () => {
  const [level, setLevel] = useState<EyeStrainLevel>('low');

  useEffect(() => {
    applyEyeStrainSettings(level);
  }, [level]);

  return (
    <div
      className="eye-strain-control"
      style={{
        position: 'fixed',
        left: '24px',
        bottom: '24px',
        width: '280px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '12px 14px',
        boxShadow: '0 16px 32px rgba(0,0,0,0.12)',
        zIndex: 9997,
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>Eye strain</span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{level.toUpperCase()}</span>
      </div>
      <input
        type="range"
        min={0}
        max={2}
        value={LEVELS.findIndex((item) => item.value === level)}
        onChange={(event) => {
          const index = Number(event.target.value);
          setLevel(LEVELS[index].value);
        }}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        {LEVELS.map((item, index) => (
          <span key={item.value} style={{ width: '33%', textAlign: index === 1 ? 'center' : index === 2 ? 'right' : 'left' }}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};
