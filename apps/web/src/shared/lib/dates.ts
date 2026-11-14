const MONTH_NAMES = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export interface Period {
  from: string;
  to: string;
}

/** Data local (não UTC) no formato YYYY-MM-DD. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Do 1º dia de (n − 1) meses atrás até o último dia do mês atual. */
export function lastMonthsPeriod(months: number, today = new Date()): Period {
  const from = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
  const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { from: toIsoDate(from), to: toIsoDate(to) };
}

/** "2026-07" → "jul/26" */
export function formatMonth(month: string): string {
  const [year = '', monthNumber = ''] = month.split('-');
  return `${MONTH_NAMES[Number(monthNumber) - 1] ?? monthNumber}/${year.slice(2)}`;
}

/** "2026-07-15" → "15/07/2026" */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}
