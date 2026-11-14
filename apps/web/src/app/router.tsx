import { createBrowserRouter, Link } from 'react-router-dom';
import { CategoriesPage } from '../features/categories/CategoriesPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { TransactionsPage } from '../features/transactions/TransactionsPage';
import { EmptyState } from '../shared/ui/EmptyState';
import { Layout } from './Layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'transactions', element: <TransactionsPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      {
        path: '*',
        element: (
          <EmptyState title="Página não encontrada.">
            <Link to="/">Voltar ao dashboard</Link>
          </EmptyState>
        ),
      },
    ],
  },
]);
