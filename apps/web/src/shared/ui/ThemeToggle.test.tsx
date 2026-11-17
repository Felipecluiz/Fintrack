import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

function mockSystemTheme(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

describe('ThemeToggle (AC-505)', () => {
  it('starts from the system theme and every click changes the screen', () => {
    mockSystemTheme(true);
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole('button', { name: 'Mudar para o tema claro' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('fintrack.theme')).toBe('light');

    fireEvent.click(screen.getByRole('button', { name: 'Mudar para o tema escuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('remembers the chosen theme over the system one', () => {
    mockSystemTheme(false);
    localStorage.setItem('fintrack.theme', 'dark');
    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: 'Mudar para o tema claro' })).toBeInTheDocument();
  });
});
