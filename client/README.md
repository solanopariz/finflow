# FinFlow — Client

Frontend do FinFlow: **React + TypeScript + Vite + Tailwind**, com React Router, TanStack Query
(dados do servidor), Recharts (gráficos) e React Hook Form + Zod (formulários).

## Pré-requisitos

- Node.js LTS (>= 20)
- API do FinFlow rodando (ver [`../server`](../server))

## Configuração

```bash
cp .env.example .env        # ajuste VITE_API_URL se necessário
npm install
npm run dev                 # http://localhost:5173
```

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Type-check + build de produção |
| `npm run preview` | Pré-visualiza a build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Estrutura

```
src/
├── main.tsx        # bootstrap (QueryClient + Router)
├── router.tsx      # definição das rotas
├── App.tsx         # shell/layout da aplicação
├── pages/          # uma tela por rota
├── lib/
│   ├── api.ts          # wrapper de fetch da API
│   └── queryClient.ts  # configuração do TanStack Query
└── index.css       # Tailwind (@import "tailwindcss")
```
