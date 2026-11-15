import type { ReactNode } from 'react';
import { Brand } from '../../shared/ui/Brand';
import { ThemeToggle } from '../../shared/ui/ThemeToggle';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <header className="auth-page__header">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="auth-card card">
        <div>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
        </div>
        {children}
        <p className="auth-card__footer muted">{footer}</p>
      </main>
    </div>
  );
}
