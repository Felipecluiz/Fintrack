import { useEffect, useState } from 'react';
import { currentTheme, onSystemThemeChange, readStoredTheme, setTheme, type Theme } from './theme';

const OPPOSITE: Record<Theme, Theme> = { light: 'dark', dark: 'light' };

/** O botão mostra para onde vai: no claro, a lua; no escuro, o sol. */
const ACTION: Record<Theme, { icon: string; label: string }> = {
  light: { icon: '☾', label: 'Tema escuro' },
  dark: { icon: '☀', label: 'Tema claro' },
};

/**
 * Alterna entre claro e escuro. Começa no tema do sistema e, depois do
 * primeiro clique, guarda a escolha (AC-505). Todo clique muda a tela.
 */
export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>(currentTheme);

  // Sem escolha guardada, acompanha o sistema se ele mudar com a página aberta.
  useEffect(
    () =>
      onSystemThemeChange(() => {
        if (!readStoredTheme()) setThemeState(currentTheme());
      }),
    [],
  );

  const toggle = () => {
    const next = OPPOSITE[theme];
    setTheme(next);
    setThemeState(next);
  };

  const action = ACTION[theme];

  return (
    <button
      type="button"
      className="button button--ghost button--small theme-toggle"
      onClick={toggle}
      aria-label={`Mudar para o ${action.label.toLowerCase()}`}
      title={`Mudar para o ${action.label.toLowerCase()}`}
    >
      <span aria-hidden>{action.icon}</span>
      <span className="theme-toggle__label" aria-hidden>
        {action.label}
      </span>
    </button>
  );
}
