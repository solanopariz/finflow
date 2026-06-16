/** Aceita meses no formato "YYYY-MM" (01–12). */
export const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Intervalo [início, fim) em UTC para um mês "YYYY-MM". */
export function monthRange(month: string): { start: Date; end: Date } {
  const [year, m] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year!, m! - 1, 1));
  const end = new Date(Date.UTC(year!, m!, 1));
  return { start, end };
}

/** Mês anterior a "YYYY-MM", também como "YYYY-MM". */
export function previousMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(year!, m! - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
