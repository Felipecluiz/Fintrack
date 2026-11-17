// Fontes hospedadas no próprio site (a CSP só permite font-src 'self').
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/figtree';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { AuthProvider } from './features/auth/AuthProvider';
import { applyThemePreference, readThemePreference } from './shared/ui/theme';
import { ToastProvider } from './shared/ui/Toaster';
import './styles.css';

// Aplica o tema salvo antes do primeiro render (evita "piscar").
applyThemePreference(readThemePreference());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
