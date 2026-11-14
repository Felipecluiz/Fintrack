const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const compactCurrency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCents(cents: number): string {
  return currency.format(cents / 100);
}

export function formatCentsCompact(cents: number): string {
  return compactCurrency.format(cents / 100);
}

/**
 * Converte o que o usuário digita ("1.234,56", "1234,5", "R$ 10") em centavos.
 * Devolve `null` se o texto não for um valor válido.
 */
export function parseAmountToCents(input: string): number | null {
  const normalized = input
    .trim()
    .replace(/R\$|\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '') // separador de milhar
    .replace(',', '.');

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  return Math.round(Number(normalized) * 100);
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}
