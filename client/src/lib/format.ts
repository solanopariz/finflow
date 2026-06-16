const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

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
