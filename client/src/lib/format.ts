const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
// As datas são armazenadas em UTC (meia-noite); formatar em UTC evita o
// deslocamento de um dia/mês em fusos atrás do UTC (ex.: UTC-3).
const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' });

export function formatCurrency(value: number): string {
  return currency.format(value);
}

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

/** Converte uma data ISO para `YYYY-MM-DD` (valor de `<input type="date">`). */
export function toDateInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

const monthFmt = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});

/** 'YYYY-MM' → rótulo curto, ex.: 'jun/26'. */
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return monthFmt.format(new Date(Date.UTC(year!, (m ?? 1) - 1, 1)));
}
