import { createBrowserRouter } from 'react-router-dom';
import { App } from './App.tsx';
import { HomePage } from './pages/HomePage.tsx';

/**
 * Roteador raiz. Novas telas (auth, transações, dashboard, ...) entram aqui
 * como rotas filhas de `App` à medida que os marcos avançam.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [{ index: true, element: <HomePage /> }],
  },
]);
