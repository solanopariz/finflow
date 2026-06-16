# FinFlow — Server

API REST do FinFlow: **Express + TypeScript + Prisma (MySQL)**, com auth JWT, validação Zod e
integração com a Anthropic Claude API (categorização e resumo por IA).

## Pré-requisitos

- Node.js LTS (>= 20)
- MySQL rodando (use o `docker compose up -d` na raiz do projeto)

## Configuração

```bash
cp .env.example .env        # ajuste segredos e ANTHROPIC_API_KEY
npm install
npm run prisma:generate     # gera o Prisma Client
npm run prisma:migrate      # cria/atualiza as tabelas
```

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Sobe a API com hot-reload (tsx) em `http://localhost:4000` |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda a build compilada |
| `npm test` | Roda os testes (Vitest + Supertest) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run prisma:migrate` | Aplica migrations de desenvolvimento |

## Estrutura

```
src/
├── index.ts            # entrypoint (sobe o servidor HTTP)
├── app.ts              # factory do app Express (usado também nos testes)
├── routes.ts           # router raiz da API (/api/*)
├── config/env.ts       # validação das variáveis de ambiente (Zod)
├── lib/prisma.ts       # singleton do Prisma Client
├── middlewares/        # erros, auth, etc.
└── modules/            # um diretório por domínio
    └── health/         # exemplo do padrão route → controller → service
```

Cada domínio segue o padrão **routes → controllers → services**: as rotas só fazem o roteamento,
os controllers lidam com HTTP (req/res) e os services concentram a regra de negócio.

## Health check

`GET /api/health` → `200` com status do servidor e do banco (`database: "up" | "down"`).
