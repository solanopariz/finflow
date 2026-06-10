# FinFlow — Roadmap

Projeto carro-chefe do portfólio: **gestor de finanças pessoais com IA**.
Demonstra full-stack completo (auth, API REST, banco relacional, dashboards, deploy) com
um diferencial de IA (categorização automática + resumo mensal narrado).

> Status atual: **M0 em andamento** — fundação criada (docker-compose, schema Prisma, envs,
> gitignore). Falta scaffold das apps (depende de Node.js instalado).

## Stack
- **Frontend:** React + TypeScript + Vite + Tailwind; React Router; TanStack Query; Recharts;
  React Hook Form + Zod.
- **Backend:** Node.js + Express + TypeScript; Prisma ORM sobre MySQL; auth JWT (access+refresh)
  com bcrypt; validação com Zod; camadas routes → controllers → services.
- **IA:** Anthropic Claude API — categorização com Claude Haiku 4.5 (`claude-haiku-4-5-20251001`,
  via tool use para JSON confiável); resumo mensal com Claude Sonnet 4.6 (`claude-sonnet-4-6`).
- **Qualidade/infra:** Vitest + Supertest (back), React Testing Library (front); ESLint + Prettier;
  GitHub Actions (lint+test); Docker Compose (MySQL local); `.env.example`.
- **Deploy:** front no Vercel; back + MySQL no Railway/Render (tiers gratuitos).

## Modelo de dados (Prisma/MySQL)
`User`, `Category` (type income/expense, cor, ícone), `Transaction` (type, amount, description,
date, source manual/import/ai), `Budget` (categoria + mês YYYY-MM + limite).
Stretch: `Account` (múltiplas carteiras) e detecção de recorrência. Ver `server/prisma/schema.prisma`.

## Funcionalidades (MVP)
1. Auth (registro/login/logout, rotas protegidas, JWT).
2. CRUD de Transações com filtros (período, categoria, tipo).
3. CRUD de Categorias.
4. Categorização por IA ao criar/importar.
5. Dashboard (saldo, receita×despesa, gastos por categoria, evolução mensal, top categorias).
6. Orçamentos por categoria com alerta ao estourar.
7. Importação de CSV (parse → IA categoriza em lote → revisar/confirmar).
8. Resumo mensal por IA (narrativa + dicas).
9. Conta de demonstração com dados semeados.
10. UI responsiva.

## Marcos (~5–6 semanas, um por vez com checkpoint)
- **M0 — Scaffold:** `client/` + `server/`, tooling, Prisma + schema, Docker MySQL, envs, READMEs. ← *atual*
- **M1 — Auth ponta a ponta:** registro/login/JWT/refresh, middleware, telas + testes.
- **M2 — Transações & Categorias:** API + UI de CRUD, filtros e listagem.
- **M3 — Dashboard:** agregações no back + gráficos (Recharts).
- **M4 — IA + CSV:** categorização por IA (tool use) + importação de CSV com revisão.
- **M5 — Orçamentos & Resumo IA:** orçamentos com alertas + resumo mensal narrado.
- **M6 — Polimento:** seed de demo, README rico (prints, diagrama), testes, CI, deploy ao vivo.

## Verificação por marco
- **M0:** `docker compose up` sobe o MySQL; `prisma migrate` cria o schema; client e server iniciam.
- **M1:** registrar/logar retorna JWT; rota protegida nega sem token; testes passam.
- **M2/M3:** transações refletem nos filtros e nos gráficos.
- **M4:** importar CSV de exemplo → IA categoriza → usuário revisa/confirma.
- **M5:** estourar orçamento dispara alerta; resumo mensal coerente.
- **M6:** demo no ar com conta de demonstração; CI verde; README reproduzível.

## Como retomar numa máquina nova
1. Instalar Node.js LTS, Docker Desktop e Git.
2. `git clone` deste repositório.
3. Seguir o M0: scaffold do `client/` (Vite+React+TS+Tailwind) e do `server/` (Express+TS+Prisma),
   `docker compose up` para o MySQL e `prisma migrate dev`.
