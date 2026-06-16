# Deploy do FinFlow

Guia para colocar o FinFlow no ar: **frontend no Vercel** e **backend + MySQL no
Railway** (ou Render). Os tiers gratuitos são suficientes para uma demonstração.

> Arquitetura em produção: front e back ficam em domínios diferentes, então o
> cookie de refresh usa `SameSite=None; Secure` (já configurado quando
> `NODE_ENV=production`) e o CORS libera o `CLIENT_ORIGIN`.

## 1. Banco + Backend (Railway)

1. Crie um projeto no [Railway](https://railway.app) e adicione um banco **MySQL**
   (plugin). Copie a connection string para `DATABASE_URL`.
2. Adicione um serviço a partir do repositório do GitHub, com **Root Directory =
   `server`**.
3. Configure as variáveis de ambiente do serviço:

   | Variável | Valor |
   |----------|-------|
   | `DATABASE_URL` | string do MySQL do Railway |
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` (ou a porta que o Railway expõe) |
   | `JWT_ACCESS_SECRET` | valor aleatório forte |
   | `JWT_REFRESH_SECRET` | outro valor aleatório forte |
   | `CLIENT_ORIGIN` | URL pública do front no Vercel (ex.: `https://finflow.vercel.app`) |
   | `ANTHROPIC_API_KEY` | sua chave da Anthropic (opcional — sem ela a IA desativa) |

4. Build e start:
   - **Build:** `npm install && npm run prisma:generate && npm run build`
   - **Migração (deploy):** `npx prisma migrate deploy`
   - **Start:** `npm start`
   - **Seed (opcional, conta de demonstração):** `npm run seed`

   > Dica: rode `prisma migrate deploy` e o `seed` uma vez via console do Railway
   > (ou como um release command) para criar as tabelas e a conta demo.

## 2. Frontend (Vercel)

1. Importe o repositório no [Vercel](https://vercel.com) com **Root Directory =
   `client`**.
2. Framework preset: **Vite**. Build: `npm run build` · Output: `dist`.
3. Variável de ambiente:

   | Variável | Valor |
   |----------|-------|
   | `VITE_API_URL` | URL pública do backend no Railway (ex.: `https://finflow-api.up.railway.app`) |

4. O [`vercel.json`](../client/vercel.json) já faz o rewrite de SPA (todas as
   rotas → `index.html`).

## 3. Pós-deploy

- Acesse o front, clique em **"Entrar na conta de demonstração"** (precisa ter
  rodado o `seed`) ou crie uma conta.
- Se o login não persistir após recarregar, verifique: `CLIENT_ORIGIN` exatamente
  igual à URL do front, `NODE_ENV=production` no back (para o cookie `Secure`), e
  ambos em **HTTPS**.

## Checklist de verificação

- [ ] `GET /api/health` do backend responde `200` com `database: "up"`.
- [ ] Registro/login funcionam e a sessão persiste após recarregar.
- [ ] Dashboard, transações, categorias e orçamentos carregam dados.
- [ ] Com `ANTHROPIC_API_KEY` setada: categorização no import e resumo mensal
      funcionam; sem ela, o app degrada com elegância.
