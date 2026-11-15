export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'fintrack.theme';

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system'; // localStorage indisponível (modo privado, sandbox)
  }
}

/**
 * Aplica e persiste o tema (AC-505). Sem `data-theme`, o CSS segue o sistema
 * via `prefers-color-scheme`.
 */
export function applyThemePreference(theme: ThemePreference): void {
  const root = document.documentElement;
  if (theme === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }

  try {
    if (theme === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sem persistência: o tema vale só para esta visita.
  }
}
