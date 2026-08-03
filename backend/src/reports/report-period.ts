import { BadRequestException } from '@nestjs/common';

export const REPORT_DEFAULT_DAYS = 30;
export const REPORT_MAX_RANGE_DAYS = 366;

export type ReportPeriod = {
  from: Date;
  to: Date;
};

/**
 * Resolve report period: default last 30 days; reject from>to or range > 366 days.
 */
export function resolveReportPeriod(from?: string, to?: string): ReportPeriod {
  const now = new Date();
  const resolvedTo = to != null && to !== '' ? new Date(to) : now;
  const resolvedFrom =
    from != null && from !== ''
      ? new Date(from)
      : new Date(resolvedTo.getTime() - REPORT_DEFAULT_DAYS * 24 * 60 * 60 * 1000);

  if (Number.isNaN(resolvedFrom.getTime()) || Number.isNaN(resolvedTo.getTime())) {
    throw new BadRequestException('Invalid from/to date');
  }

  if (resolvedFrom.getTime() > resolvedTo.getTime()) {
    throw new BadRequestException('from must be less than or equal to to');
  }

  const rangeMs = resolvedTo.getTime() - resolvedFrom.getTime();
  const maxMs = REPORT_MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;
  if (rangeMs > maxMs) {
    throw new BadRequestException(`Date range must not exceed ${REPORT_MAX_RANGE_DAYS} days`);
  }

  return { from: resolvedFrom, to: resolvedTo };
}
