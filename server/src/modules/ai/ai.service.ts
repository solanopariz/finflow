import type Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../lib/prisma.js';
import { CATEGORIZER_MODEL, getAnthropic } from '../../lib/anthropic.js';
import type { CategorizeItem } from './ai.schemas.js';

export interface CategorizationResult {
  index: number;
  categoryId: string | null;
  categoryName: string | null;
  confidence: number;
}

/** Tool que força a IA a devolver JSON estruturado com uma atribuição por transação. */
const ASSIGN_TOOL: Anthropic.Tool = {
  name: 'assign_categories',
  description:
    'Atribui a melhor categoria existente a cada transação. Use "none" quando nenhuma categoria for adequada.',
  input_schema: {
    type: 'object',
    properties: {
      assignments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            index: { type: 'integer', description: 'Índice da transação na lista de entrada' },
            categoryId: {
              type: 'string',
              description: 'ID de uma categoria fornecida, ou "none" se nenhuma servir',
            },
            confidence: { type: 'number', description: 'Confiança de 0 a 1' },
          },
          required: ['index', 'categoryId', 'confidence'],
          additionalProperties: false,
        },
      },
    },
    required: ['assignments'],
    additionalProperties: false,
  },
};

interface RawAssignment {
  index: number;
  categoryId: string;
  confidence: number;
}

/**
 * Categoriza transações escolhendo entre as categorias existentes do usuário.
 * Usa Claude Haiku 4.5 via tool use; valida que cada ID retornado pertence ao
 * usuário e tem o mesmo tipo da transação, caindo para "sem categoria" se não.
 */
export async function categorizeTransactions(
  userId: string,
  items: CategorizeItem[],
): Promise<CategorizationResult[]> {
  const categories = await prisma.category.findMany({
    where: { userId },
    select: { id: true, name: true, type: true },
  });

  // Sem categorias cadastradas: não há o que sugerir.
  if (categories.length === 0) {
    return items.map((_, index) => ({ index, categoryId: null, categoryName: null, confidence: 0 }));
  }

  const byId = new Map(categories.map((c) => [c.id, c]));
  const prompt = buildPrompt(categories, items);

  const message = await getAnthropic().messages.create({
    model: CATEGORIZER_MODEL,
    max_tokens: 2048,
    tools: [ASSIGN_TOOL],
    tool_choice: { type: 'tool', name: 'assign_categories' },
    messages: [{ role: 'user', content: prompt }],
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  );
  const raw = (toolUse?.input as { assignments?: RawAssignment[] } | undefined)?.assignments ?? [];

  // Indexa as respostas e valida cada uma contra as categorias do usuário e o tipo.
  const byIndex = new Map(raw.map((a) => [a.index, a]));
  return items.map((item, index) => {
    const assignment = byIndex.get(index);
    const category = assignment ? byId.get(assignment.categoryId) : undefined;
    if (!category || category.type !== item.type) {
      return { index, categoryId: null, categoryName: null, confidence: 0 };
    }
    return {
      index,
      categoryId: category.id,
      categoryName: category.name,
      confidence: clampConfidence(assignment?.confidence),
    };
  });
}

function clampConfidence(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function buildPrompt(
  categories: { id: string; name: string; type: string }[],
  items: CategorizeItem[],
): string {
  const catLines = categories
    .map((c) => `- id=${c.id} | nome="${c.name}" | tipo=${c.type}`)
    .join('\n');
  const txLines = items
    .map(
      (t, i) =>
        `${i}. tipo=${t.type} | valor=${t.amount.toFixed(2)} | descrição="${t.description}"`,
    )
    .join('\n');

  return [
    'Você categoriza transações financeiras pessoais (em português do Brasil).',
    'Para cada transação, escolha a categoria existente mais adequada cujo tipo seja igual ao da transação.',
    'Use exatamente um dos IDs fornecidos, ou "none" quando nenhuma categoria for claramente adequada.',
    'Não invente IDs nem categorias novas.',
    '',
    'Categorias disponíveis:',
    catLines,
    '',
    'Transações a categorizar:',
    txLines,
    '',
    'Chame a ferramenta assign_categories com uma atribuição por transação (um item por índice).',
  ].join('\n');
}
