import type { DashboardSummaryDTO } from '@fintrack/contracts';
import { useQuery } from '@tanstack/react-query';
import { http, toQueryString } from '../../shared/api/httpClient';
import { queryKeys } from '../../shared/api/queryKeys';
import { lastMonthsPeriod } from '../../shared/lib/dates';

export const dashboardApi = {
  summary: (from: string, to: string) =>
    http<DashboardSummaryDTO>(`/api/dashboard/summary${toQueryString({ from, to })}`),
};

export function useDashboardSummary(months: number) {
  const { from, to } = lastMonthsPeriod(months);
  return useQuery({
    queryKey: queryKeys.dashboardSummary(from, to),
    queryFn: () => dashboardApi.summary(from, to),
  });
}
