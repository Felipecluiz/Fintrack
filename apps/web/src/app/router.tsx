import { createBrowserRouter, Link, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { RequireAuth } from '../features/auth/RequireAuth';
import { CategoriesPage } from '../features/categories/CategoriesPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LandingPage } from '../features/landing/LandingPage';
import { TransactionsPage } from '../features/transactions/TransactionsPage';
import { EmptyState } from '../shared/ui/EmptyState';
import { Layout } from './Layout';

export const router = createBrowserRouter([
  // Públicas
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // App (exige sessão — AC-503)
  {
    path: '/app',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
    ],
  },

  // Endereços antigos (antes de existir a landing)
  { path: '/transactions', element: <Navigate to="/app/transactions" replace /> },
  { path: '/categories', element: <Navigate to="/app/categories" replace /> },

  {
    path: '*',
    element: (
      <div className="auth-page">
        <EmptyState title="Página não encontrada.">
          <Link to="/">Voltar ao início</Link>
        </EmptyState>
      </div>
    ),
  },
],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
