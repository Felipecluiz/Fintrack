export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'fintrack.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Tema escolhido pela pessoa, ou `null` se ela nunca escolheu (segue o sistema). */
export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null; // localStorage indisponível (modo privado, sandbox)
  }
}

export function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
}

/** O tema que está na tela agora: o escolhido ou, sem escolha, o do sistema. */
export function currentTheme(): Theme {
  return readStoredTheme() ?? systemTheme();
}

/**
 * Aplica o tema guardado (AC-505). Sem escolha guardada, não há `data-theme`
 * e o CSS segue o sistema via `prefers-color-scheme`.
 */
export function applyStoredTheme(): void {
  const stored = readStoredTheme();
  if (stored) document.documentElement.dataset.theme = stored;
  else delete document.documentElement.dataset.theme;
}

/** Fixa o tema escolhido e o guarda para as próximas visitas. */
export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sem persistência: o tema vale só para esta visita.
  }
}

/** Avisa quando o tema do sistema muda (só importa enquanto não houver escolha). */
export function onSystemThemeChange(listener: () => void): () => void {
  const media = window.matchMedia?.(DARK_QUERY);
  media?.addEventListener?.('change', listener);
  return () => media?.removeEventListener?.('change', listener);
}
