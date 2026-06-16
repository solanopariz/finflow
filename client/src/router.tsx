import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { App } from './App.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';

// Páginas protegidas em chunks separados (carregadas sob demanda). O Dashboard
// arrasta o Recharts, então só baixa quando o usuário abre a tela.
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage.tsx').then((m) => ({ default: m.DashboardPage })),
);
const TransactionsPage = lazy(() =>
  import('./pages/TransactionsPage.tsx').then((m) => ({ default: m.TransactionsPage })),
);
const CategoriesPage = lazy(() =>
  import('./pages/CategoriesPage.tsx').then((m) => ({ default: m.CategoriesPage })),
);
const BudgetsPage = lazy(() =>
  import('./pages/BudgetsPage.tsx').then((m) => ({ default: m.BudgetsPage })),
);
const ImportPage = lazy(() =>
  import('./pages/ImportPage.tsx').then((m) => ({ default: m.ImportPage })),
);

/**
 * Rotas públicas (login/registro) e rotas protegidas sob `ProtectedRoute`.
 * Novas telas (transações, dashboard, ...) entram como filhas de `App`.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <App />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'transactions', element: <TransactionsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'budgets', element: <BudgetsPage /> },
          { path: 'import', element: <ImportPage /> },
        ],
      },
    ],
  },
]);
