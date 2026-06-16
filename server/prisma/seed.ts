import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@finflow.dev';
const DEMO_PASSWORD = 'demo1234';

/** Data UTC para `monthsAgo` meses atrás, no dia informado. */
function dateFor(monthsAgo: number, day: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, day));
}

/** "YYYY-MM" para `monthsAgo` meses atrás. */
function monthKey(monthsAgo: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const EXPENSE_CATEGORIES = [
  { name: 'Aluguel', color: '#f97316' },
  { name: 'Mercado', color: '#ef4444' },
  { name: 'Transporte', color: '#3b82f6' },
  { name: 'Lazer', color: '#8b5cf6' },
  { name: 'Saúde', color: '#14b8a6' },
  { name: 'Restaurante', color: '#eab308' },
];

const INCOME_CATEGORIES = [
  { name: 'Salário', color: '#22c55e' },
  { name: 'Freelance', color: '#10b981' },
];

interface TxTemplate {
  category: string;
  amount: number; // positivo
  day: number;
  source?: 'MANUAL' | 'IMPORT' | 'AI';
}

/** Lançamentos de um mês. O mês corrente é calibrado para os status de orçamento. */
function monthTransactions(monthsAgo: number): TxTemplate[] {
  const txs: TxTemplate[] = [
    { category: 'Salário', amount: 5000, day: 5, source: 'MANUAL' },
    { category: 'Aluguel', amount: 1500, day: 6, source: 'MANUAL' },
    { category: 'Mercado', amount: 350, day: 8, source: 'IMPORT' },
    { category: 'Mercado', amount: 320, day: 19, source: 'AI' },
    { category: 'Transporte', amount: 180, day: 10, source: 'IMPORT' },
    { category: 'Lazer', amount: 90, day: 14, source: 'AI' },
    { category: 'Lazer', amount: 80, day: 22, source: 'MANUAL' },
    { category: 'Restaurante', amount: 120, day: 16, source: 'AI' },
    { category: 'Saúde', amount: 65, day: 18, source: 'MANUAL' },
  ];
  if (monthsAgo === 0 || monthsAgo === 2) {
    txs.push({ category: 'Freelance', amount: 800, day: 24, source: 'MANUAL' });
  }
  return txs;
}

async function main(): Promise<void> {
  // Recria a conta de demonstração do zero (cascade limpa dados antigos).
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      name: 'Conta Demonstração',
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
    },
  });

  const categories = await Promise.all([
    ...INCOME_CATEGORIES.map((c) =>
      prisma.category.create({ data: { ...c, type: 'INCOME', userId: user.id } }),
    ),
    ...EXPENSE_CATEGORIES.map((c) =>
      prisma.category.create({ data: { ...c, type: 'EXPENSE', userId: user.id } }),
    ),
  ]);
  const byName = new Map(categories.map((c) => [c.name, c]));

  const transactions = [];
  for (let monthsAgo = 3; monthsAgo >= 0; monthsAgo--) {
    for (const tx of monthTransactions(monthsAgo)) {
      const category = byName.get(tx.category)!;
      transactions.push({
        userId: user.id,
        categoryId: category.id,
        type: category.type,
        amount: tx.amount,
        description: tx.category,
        date: dateFor(monthsAgo, tx.day),
        source: tx.source ?? 'MANUAL',
      });
    }
  }
  await prisma.transaction.createMany({ data: transactions });

  // Orçamentos do mês corrente: Mercado estoura (670>600), Lazer atenção (170/200), Transporte ok.
  const month = monthKey(0);
  await prisma.budget.createMany({
    data: [
      { userId: user.id, categoryId: byName.get('Mercado')!.id, month, limitAmount: 600 },
      { userId: user.id, categoryId: byName.get('Lazer')!.id, month, limitAmount: 200 },
      { userId: user.id, categoryId: byName.get('Transporte')!.id, month, limitAmount: 300 },
    ],
  });

  console.log(
    `✅ Seed concluído: ${DEMO_EMAIL} / ${DEMO_PASSWORD} — ${transactions.length} transações, ${categories.length} categorias, 3 orçamentos.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
