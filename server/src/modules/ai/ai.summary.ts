import type Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../lib/prisma.js';
import { getAnthropic, SUMMARY_MODEL } from '../../lib/anthropic.js';
import { monthRange, previousMonth } from '../../lib/month.js';

export interface MonthSummary {
  month: string;
  summary: string;
}

const monthLabelFmt = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return monthLabelFmt.format(new Date(Date.UTC(y!, m! - 1, 1)));
}

async function expenseTotal(userId: string, month: string): Promise<number> {
  const { start, end } = monthRange(month);
  const agg = await prisma.transaction.aggregate({
    where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return agg._sum.amount ? agg._sum.amount.toNumber() : 0;
}

/**
 * Gera um resumo mensal narrado por IA (Claude Sonnet 4.6) a partir de dados
 * reais agregados do mês — totais, gastos por categoria, orçamentos estourados
 * e comparação com o mês anterior — para que a narrativa seja fundamentada.
 */
export async function summarizeMonth(userId: string, month: string): Promise<MonthSummary> {
  const { start, end } = monthRange(month);
  const txs = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    include: { category: true },
  });

  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, number>();
  for (const tx of txs) {
    const amount = tx.amount.toNumber();
    if (tx.type === 'INCOME') {
      income += amount;
    } else {
      expense += amount;
      const name = tx.category?.name ?? 'Sem categoria';
      byCategory.set(name, (byCategory.get(name) ?? 0) + amount);
    }
  }

  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const budgets = await prisma.budget.findMany({ where: { userId, month }, include: { category: true } });
  const exceeded: string[] = [];
  for (const b of budgets) {
    const spent = byCategory.get(b.category.name) ?? 0;
    if (spent > b.limitAmount.toNumber()) {
      exceeded.push(`${b.category.name} (gastou ${spent.toFixed(2)} de ${b.limitAmount.toNumber().toFixed(2)})`);
    }
  }

  const prevExpense = await expenseTotal(userId, previousMonth(month));

  const data = [
    `Mês: ${monthLabel(month)}`,
    `Receitas: R$ ${income.toFixed(2)}`,
    `Despesas: R$ ${expense.toFixed(2)}`,
    `Saldo: R$ ${(income - expense).toFixed(2)}`,
    `Despesas do mês anterior: R$ ${prevExpense.toFixed(2)}`,
    `Número de transações: ${txs.length}`,
    topCategories.length
      ? `Maiores gastos por categoria: ${topCategories.map(([n, v]) => `${n} R$ ${v.toFixed(2)}`).join('; ')}`
      : 'Sem despesas categorizadas.',
    exceeded.length ? `Orçamentos estourados: ${exceeded.join('; ')}` : 'Nenhum orçamento estourado.',
  ].join('\n');

  const prompt = [
    'Você é um assistente financeiro pessoal. Escreva um resumo mensal em português do Brasil,',
    'em tom amigável e direto, com base nos dados abaixo. Estruture em 2 a 3 parágrafos curtos:',
    '(1) panorama do mês (receitas, despesas, saldo e comparação com o mês anterior),',
    '(2) para onde o dinheiro foi (categorias) e alertas de orçamento estourado, se houver,',
    '(3) uma ou duas dicas práticas e específicas. Não invente números além dos fornecidos.',
    'Não use markdown nem títulos; apenas texto corrido.',
    '',
    'Dados do mês:',
    data,
  ].join('\n');

  const message = await getAnthropic().messages.create({
    model: SUMMARY_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  )?.text;

  return { month, summary: text?.trim() ?? '' };
}
