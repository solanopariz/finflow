import { createBrowserRouter } from 'react-router-dom';
import { App } from './App.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { BudgetsPage } from './pages/BudgetsPage.tsx';
import { CategoriesPage } from './pages/CategoriesPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ImportPage } from './pages/ImportPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { TransactionsPage } from './pages/TransactionsPage.tsx';

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
