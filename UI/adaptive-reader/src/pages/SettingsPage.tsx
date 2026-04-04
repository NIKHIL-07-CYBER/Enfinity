// DONE: Task 1b — SettingsPage
import React, { useState, useEffect } from 'react';
import { TopNav } from '@/components/Layout/TopNav';
import { resetAllData } from '@/utils/persistence';

interface ReaderSettings {
  defaultLanguage: string;
  targetWPM: number;
  fontSize: number;
  theme: 'light' | 'sepia' | 'dark';
  brightnessAdapterEnabled: boolean;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  defaultLanguage: 'en',
  targetWPM: 150,
  fontSize: 18,
  theme: 'light',
  brightnessAdapterEnabled: true,
};

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
];

const THEMES: { value: ReaderSettings['theme']; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'dark', label: 'Dark' },
];

function loadSettings(): ReaderSettings {
  try {
    const stored = localStorage.getItem('reader_settings');
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch { /* empty */ }
  return { ...DEFAULT_SETTINGS };
}

function persistSettings(settings: ReaderSettings) {
  localStorage.setItem('reader_settings', JSON.stringify(settings));
}

function applyTheme(theme: ReaderSettings['theme']) {
  document.documentElement.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
  document.documentElement.classList.add(`theme-${theme}`);
}

function applyFontSize(size: number) {
  document.documentElement.style.setProperty('--font-size', `${size}px`);
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(settings.theme);
    applyFontSize(settings.fontSize);
  }, [settings.theme, settings.fontSize]);

  const update = (partial: Partial<ReaderSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      persistSettings(next);
      return next;
    });
  };

  const handleResetAll = async () => {
    await resetAllData();
    localStorage.removeItem('reader_settings');
    localStorage.removeItem('chatbot_messages');
    localStorage.removeItem('chatbot_avatar_config');
    localStorage.removeItem('adaptation_enabled');
    localStorage.removeItem('focus_mode');
    setSettings({ ...DEFAULT_SETTINGS });
    setToastMsg('Data cleared');
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg-color)' }}>
      <TopNav />
      <main className="w-full max-w-[560px] mx-auto px-6 pt-32 pb-16">
        <div className="text-[11px] tracking-widest font-bold uppercase mb-4" style={{ color: 'var(--nav-text)' }}>
          PREFERENCES
        </div>
        <h1 className="text-[42px] font-bold mb-10" style={{ color: 'var(--text-color)' }}>
          Settings
        </h1>

        {/* Language */}
        <div className="mb-8">
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
            Default Reading Language
          </label>
          <select
            value={settings.defaultLanguage}
            onChange={(e) => update({ defaultLanguage: e.target.value })}
            className="w-full p-3 rounded-lg border text-sm"
            style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
          >
            {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        {/* Target WPM */}
        <div className="mb-8">
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
            Target WPM: {settings.targetWPM}
          </label>
          <input
            type="range"
            min={80}
            max={300}
            value={settings.targetWPM}
            onChange={(e) => update({ targetWPM: Number(e.target.value) })}
            className="w-full accent-[#185FA5]"
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--nav-text)' }}>
            <span>80</span><span>300</span>
          </div>
        </div>

        {/* Font Size */}
        <div className="mb-8">
          <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-color)' }}>
            Font Size: {settings.fontSize}px
          </label>
          <input
            type="range"
            min={14}
            max={24}
            value={settings.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            className="w-full accent-[#185FA5]"
          />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--nav-text)' }}>
            <span>14px</span><span>24px</span>
          </div>
        </div>

        {/* Theme */}
        <div className="mb-8">
          <label className="block text-sm font-bold mb-3" style={{ color: 'var(--text-color)' }}>
            Theme
          </label>
          <div className="flex gap-3">
            {THEMES.map(t => (
              <button
                key={t.value}
                onClick={() => update({ theme: t.value })}
                className="flex-1 py-3 rounded-lg text-sm font-bold tracking-widest uppercase border transition-all"
                style={{
                  borderColor: settings.theme === t.value ? 'var(--accent-blue)' : 'var(--card-border)',
                  backgroundColor: settings.theme === t.value ? 'rgba(24,95,165,0.08)' : 'transparent',
                  color: settings.theme === t.value ? 'var(--accent-blue)' : 'var(--nav-text)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Brightness */}
        <div className="mb-8 flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: 'var(--card-border)' }}>
          <span className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>Dynamic brightness</span>
          <button
            onClick={() => update({ brightnessAdapterEnabled: !settings.brightnessAdapterEnabled })}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{ backgroundColor: settings.brightnessAdapterEnabled ? 'var(--accent-blue)' : '#ccc' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ left: settings.brightnessAdapterEnabled ? '26px' : '2px' }}
            />
          </button>
        </div>

        {/* Reset All */}
        <div className="pt-8 border-t" style={{ borderColor: 'var(--card-border)' }}>
          <button
            onClick={handleResetAll}
            className="w-full py-3 rounded-lg font-bold text-sm tracking-widest uppercase border border-red-300 text-red-500 transition-colors hover:bg-red-50"
          >
            Reset All Data
          </button>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div
            className="fixed bottom-6 right-6 px-5 py-3 rounded-lg text-white text-sm font-medium shadow-lg"
            style={{ backgroundColor: 'rgba(20, 40, 80, 0.92)', zIndex: 9000 }}
          >
            {toastMsg}
          </div>
        )}
      </main>
    </div>
  );
};
