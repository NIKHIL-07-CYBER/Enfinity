import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { applyEyeStrainSettings, type EyeStrainLevel } from '@/utils/eyeStrain';
import { useUIStore } from '@/store/uiStore';

const LEVELS: { value: EyeStrainLevel; label: string }[] = [
  { value: 'low', label: 'Low Strain' },
  { value: 'medium', label: 'Medium Strain' },
  { value: 'high', label: 'High Strain' },
];

export const EyeStrainControl: React.FC = () => {
  const [level, setLevel] = useState<EyeStrainLevel>('low');
  const visible = useUIStore((s) => s.eyeStrainVisible);
  const toggle = useUIStore((s) => s.toggleEyeStrain);

  useEffect(() => {
    applyEyeStrainSettings(level);
  }, [level]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="eye-strain-control"
          style={{
            position: 'fixed',
            right: '24px',
            top: '72px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{level.toUpperCase()}</span>
              <button
                type="button"
                onClick={toggle}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '16px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: '2px',
                }}
              >
                ×
              </button>
            </div>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};
