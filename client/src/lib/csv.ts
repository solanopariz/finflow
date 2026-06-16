import type { CategoryType } from './api.ts';

export interface ParsedRow {
  date: string; // ISO
  description: string;
  amount: number; // sempre positivo
  type: CategoryType; // derivado do sinal do valor
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: string[];
}

const HEADER_RE = /^\s*"?data"?\s*,/i;

function splitCsvLine(line: string): string[] {
  // Parser simples com suporte a campos entre aspas e vírgula interna.
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

function parseAmount(raw: string): number | null {
  let value = raw.replace(/\s|R\$/g, '');
  // Decimal com vírgula (formato BR) → ponto, quando não houver ponto.
  if (value.includes(',') && !value.includes('.')) {
    value = value.replace(',', '.');
  } else {
    value = value.replace(/,/g, '');
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parseia um CSV no formato fixo `data, descrição, valor`. Valor positivo é
 * receita, negativo é despesa. Linhas inválidas viram mensagens em `errors`.
 */
export function parseTransactionsCsv(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  const start = lines.length > 0 && HEADER_RE.test(lines[0]!) ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const lineNo = i + 1;
    const [dateStr, description, amountStr] = splitCsvLine(lines[i]!);

    if (!dateStr || !description || amountStr === undefined || amountStr === '') {
      errors.push(`Linha ${lineNo}: colunas faltando (esperado data, descrição, valor)`);
      continue;
    }

    const parsedDate = new Date(dateStr);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push(`Linha ${lineNo}: data inválida "${dateStr}"`);
      continue;
    }

    const amount = parseAmount(amountStr);
    if (amount === null || amount === 0) {
      errors.push(`Linha ${lineNo}: valor inválido "${amountStr}"`);
      continue;
    }

    rows.push({
      date: parsedDate.toISOString(),
      description,
      amount: Math.abs(amount),
      type: amount >= 0 ? 'INCOME' : 'EXPENSE',
    });
  }

  return { rows, errors };
}
