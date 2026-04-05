export type Theme = 'light' | 'dark' | 'sepia';

export function applyTheme(theme: Theme): void {
  const html = document.documentElement;
  html.classList.remove('dark', 'sepia');
  html.dataset.theme = theme;
  if (theme === 'dark') html.classList.add('dark');
  if (theme === 'sepia') html.classList.add('sepia');
  localStorage.setItem('theme', theme);
}

export function getStoredTheme(): Theme {
  const v = localStorage.getItem('theme') as Theme | null;
  if (v === 'dark' || v === 'sepia' || v === 'light') return v;
  return 'light';
}

export function initTheme(): void {
  if (!localStorage.getItem('theme')) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  } else {
    applyTheme(getStoredTheme());
  }
}
