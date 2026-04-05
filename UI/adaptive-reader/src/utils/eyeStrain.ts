export type EyeStrainLevel = 'low' | 'medium' | 'high';

export function applyEyeStrainSettings(level: EyeStrainLevel): void {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark') || html.dataset.theme === 'dark';

  const config = {
    low: {
      '--bg-color': isDark ? '#16181f' : '#ffffff',
      '--bg-secondary': isDark ? '#1b1e28' : '#f7f4ee',
      '--bg-tertiary': isDark ? '#23263a' : '#f1edeb',
      '--text-color': isDark ? '#f5f5f7' : '#111111',
      '--border-color': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,24,0.10)',
      '--selection-bg': isDark ? 'rgba(106,171,236,0.25)' : 'rgba(24,95,165,0.15)',
      '--font-size': isDark ? '18px' : '18px',
      '--line-height': '1.75',
      '--toolbar-surface': isDark ? 'rgba(27,30,38,0.92)' : 'color-mix(in srgb, var(--bg-secondary) 92%, var(--accent-blue) 8%)',
    },
    medium: {
      '--bg-color': isDark ? '#181c2b' : '#fdf6e3',
      '--bg-secondary': isDark ? '#1f2440' : '#fbf1dd',
      '--bg-tertiary': isDark ? '#272d4f' : '#f7e9d1',
      '--text-color': isDark ? '#f0f0f5' : '#1a1a18',
      '--border-color': isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,26,24,0.16)',
      '--selection-bg': isDark ? 'rgba(106,171,236,0.28)' : 'rgba(24,95,165,0.18)',
      '--font-size': isDark ? '19px' : '19px',
      '--line-height': '1.85',
      '--toolbar-surface': isDark ? 'rgba(31,36,55,0.95)' : 'rgba(253,246,227,0.92)',
    },
    high: {
      '--bg-color': isDark ? '#0d1016' : '#111318',
      '--bg-secondary': isDark ? '#13171f' : '#1f242e',
      '--bg-tertiary': isDark ? '#1c2230' : '#28303f',
      '--text-color': '#f8f8f8',
      '--border-color': 'rgba(255,255,255,0.10)',
      '--selection-bg': 'rgba(255,255,255,0.12)',
      '--font-size': '20px',
      '--line-height': '2.05',
      '--toolbar-surface': 'rgba(28,32,44,0.96)',
    },
  } as const;

  const settings = config[level];
  Object.entries(settings).forEach(([key, value]) => {
    html.style.setProperty(key, value as string);
  });
}

export function getEyeStrainLevel(elapsedMinutes: number): EyeStrainLevel {
  if (elapsedMinutes >= 60) {
    return 'high';
  }
  if (elapsedMinutes >= 30) {
    return 'medium';
  }
  return 'low';
}
