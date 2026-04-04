import React from 'react';
import type { Theme } from '@/utils/themeManager';
import { useSettingsStore } from '@/store/settingsStore';

const MODES: { id: Theme; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'dark', label: 'Dark' },
];

export const ThemeToggle: React.FC = () => {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <div
      className="flex rounded-md overflow-hidden border"
      style={{
        borderColor: 'var(--border-color)',
        height: '30px',
      }}
      role="group"
      aria-label="Theme"
    >
      {MODES.map(({ id, label }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            className="px-2.5 text-xs font-medium transition-colors"
            style={{
              background: active ? 'var(--accent-blue)' : 'transparent',
              color: active ? 'var(--toolbar-on-accent)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              minWidth: '48px',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
