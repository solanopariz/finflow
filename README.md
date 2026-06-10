# FinFlow 💸

Gestor de finanças pessoais **full-stack** com **IA**: registre receitas e despesas (manual ou
importando CSV), deixe a IA **categorizar automaticamente** as transações e acompanhe para onde o
dinheiro vai em dashboards claros. Inclui orçamentos com alertas e um **resumo mensal narrado por IA**.

> 🚧 Em desenvolvimento. Veja o plano completo em [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React · TypeScript · Vite · Tailwind · React Router · TanStack Query · Recharts |
| Backend | Node.js · Express · TypeScript · Prisma · MySQL · JWT |
| IA | Anthropic Claude API (categorização + resumo) |
| Infra | Docker Compose (MySQL) · Vitest · ESLint · Prettier · GitHub Actions |

## Estrutura

```
finflow/
├── client/             # app React (frontend)
├── server/             # API Express + Prisma (backend)
│   └── prisma/         # schema do banco
├── docker-compose.yml  # MySQL local
└── docs/ROADMAP.md     # plano e marcos do projeto
```

## Rodando localmente (depois do scaffold)

Pré-requisitos: **Node.js LTS**, **Docker Desktop** e **Git**.

```bash
# 1. Subir o banco MySQL
docker compose up -d

# 2. Backend
cd server
cp .env.example .env        # ajuste os segredos e a ANTHROPIC_API_KEY
npm install
npx prisma migrate dev      # cria as tabelas
npm run dev                 # http://localhost:4000

# 3. Frontend (em outro terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Licença

MIT.
