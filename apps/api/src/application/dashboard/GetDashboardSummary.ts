import type { DashboardQuery, DashboardSummaryDTO, MonthlyTotalDTO } from '@fintrack/contracts';
import { CalendarDate } from '../../domain/shared/CalendarDate';
import { ValidationError } from '../../domain/shared/errors';
import type { Clock } from '../ports/Clock';
import { endOfMonth, monthsBetween, startOfMonth } from './months';
import type { MonthlyTotal, Period, ReportReader } from './ReportReader';

export const DEFAULT_PERIOD_IN_MONTHS = 6;
export const MAX_PERIOD_IN_MONTHS = 24;

export class GetDashboardSummary {
  constructor(
    private readonly reports: ReportReader,
    private readonly clock: Clock,
  ) {}

  async execute(query: DashboardQuery): Promise<DashboardSummaryDTO> {
    const period = this.resolvePeriod(query);

    const [totals, expensesByCategory, monthly] = await Promise.all([
      this.reports.totals(period),
      this.reports.expensesByCategory(period),
      this.reports.monthlyTotals(period),
    ]);

    return {
      period: { from: period.from.toString(), to: period.to.toString() },
      totals: {
        ...totals,
        balanceCents: totals.incomeCents - totals.expenseCents, // BR-303
      },
      expensesByCategory,
      monthly: this.fillMissingMonths(period, monthly),
    };
  }

  /** BR-301, BR-302, BR-306 */
  private resolvePeriod(query: DashboardQuery): Period {
    const today = CalendarDate.fromDate(this.clock.now());
    const from = query.from
      ? CalendarDate.parse(query.from)
      : startOfMonth(today, -(DEFAULT_PERIOD_IN_MONTHS - 1));
    const to = query.to ? CalendarDate.parse(query.to) : endOfMonth(today);

    if (from.isAfter(to)) {
      throw new ValidationError(`"from" (${from}) must not be after "to" (${to})`);
    }
    if (monthsBetween(from, to).length > MAX_PERIOD_IN_MONTHS) {
      throw new ValidationError(`The period must span at most ${MAX_PERIOD_IN_MONTHS} months`);
    }
    return { from, to };
  }

  /** BR-304 */
  private fillMissingMonths(period: Period, monthly: MonthlyTotal[]): MonthlyTotalDTO[] {
    const byMonth = new Map(monthly.map((entry) => [entry.month, entry]));
    return monthsBetween(period.from, period.to).map(
      (month) => byMonth.get(month) ?? { month, incomeCents: 0, expenseCents: 0 },
    );
  }
}
