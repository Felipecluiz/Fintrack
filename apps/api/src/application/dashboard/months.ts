import { CalendarDate } from '../../domain/shared/CalendarDate';

interface YearMonth {
  year: number;
  /** 1–12 */
  month: number;
}

/** Todos os meses (YYYY-MM) entre duas datas, inclusive (BR-304). */
export function monthsBetween(from: CalendarDate, to: CalendarDate): string[] {
  const months: string[] = [];
  const end = toYearMonth(to);
  let cursor = toYearMonth(from);

  while (isSameOrBefore(cursor, end)) {
    months.push(formatYearMonth(cursor));
    cursor = nextMonth(cursor);
  }
  return months;
}

export function startOfMonth(date: CalendarDate, offsetInMonths = 0): CalendarDate {
  const { year, month } = toYearMonth(date);
  return CalendarDate.fromDate(new Date(Date.UTC(year, month - 1 + offsetInMonths, 1)));
}

export function endOfMonth(date: CalendarDate): CalendarDate {
  const { year, month } = toYearMonth(date);
  // Dia 0 do mês seguinte = último dia do mês atual.
  return CalendarDate.fromDate(new Date(Date.UTC(year, month, 0)));
}

function toYearMonth(date: CalendarDate): YearMonth {
  const [year, month] = date.month.split('-').map(Number);
  return { year: year ?? 0, month: month ?? 1 };
}

function isSameOrBefore(a: YearMonth, b: YearMonth): boolean {
  return a.year < b.year || (a.year === b.year && a.month <= b.month);
}

function nextMonth({ year, month }: YearMonth): YearMonth {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

function formatYearMonth({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}
