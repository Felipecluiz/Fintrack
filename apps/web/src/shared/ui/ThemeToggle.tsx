import { useState } from 'react';
import { applyThemePreference, readThemePreference, type ThemePreference } from './theme';

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const LABEL: Record<ThemePreference, string> = {
  system: 'Tema: sistema',
  light: 'Tema: claro',
  dark: 'Tema: escuro',
};

const ICON: Record<ThemePreference, string> = {
  system: '◐',
  light: '☀',
  dark: '☾',
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(readThemePreference);

  const cycle = () => {
    const next = NEXT[theme];
    applyThemePreference(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="button button--ghost button--small theme-toggle"
      onClick={cycle}
      title={`${LABEL[theme]} (clique para alternar)`}
    >
      <span aria-hidden>{ICON[theme]}</span>
      <span className="theme-toggle__label">{LABEL[theme]}</span>
    </button>
  );
}
