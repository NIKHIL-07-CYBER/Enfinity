export type Theme = 'light' | 'dark' | 'sepia';

export function applyTheme(theme: Theme): void {
  const html = document.documentElement;
  html.classList.remove('dark', 'sepia', 'theme-light', 'theme-sepia', 'theme-dark');
  if (theme === 'dark') html.classList.add('dark');
  if (theme === 'sepia') html.classList.add('sepia');
  localStorage.setItem('theme', theme);
}

export function getStoredTheme(): Theme {
  const v = localStorage.getItem('theme');
  if (v === 'dark' || v === 'sepia' || v === 'light') return v;
  return 'light';
}

export function initTheme(): void {
  if (!localStorage.getItem('theme')) {
    try {
      const rs = localStorage.getItem('reader_settings');
      if (rs) {
        const t = JSON.parse(rs).theme;
        if (t === 'dark' || t === 'sepia' || t === 'light') {
          applyTheme(t);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  } else {
    applyTheme(getStoredTheme());
  }
}
