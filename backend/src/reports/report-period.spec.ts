import { BadRequestException } from '@nestjs/common';
import {
  REPORT_DEFAULT_DAYS,
  REPORT_MAX_RANGE_DAYS,
  resolveReportPeriod,
} from './report-period';

describe('resolveReportPeriod', () => {
  it('defaults to last 30 days ending now when from/to omitted', () => {
    const before = Date.now();
    const { from, to } = resolveReportPeriod();
    const after = Date.now();

    expect(to.getTime()).toBeGreaterThanOrEqual(before);
    expect(to.getTime()).toBeLessThanOrEqual(after);
    const days = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBeCloseTo(REPORT_DEFAULT_DAYS, 0);
  });

  it('accepts explicit from/to', () => {
    const { from, to } = resolveReportPeriod(
      '2026-07-01T00:00:00.000Z',
      '2026-07-31T00:00:00.000Z',
    );
    expect(from.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(to.toISOString()).toBe('2026-07-31T00:00:00.000Z');
  });

  it('rejects from > to', () => {
    expect(() =>
      resolveReportPeriod('2026-08-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z'),
    ).toThrow(BadRequestException);
  });

  it('rejects range longer than max days', () => {
    expect(() =>
      resolveReportPeriod('2024-01-01T00:00:00.000Z', '2026-01-10T00:00:00.000Z'),
    ).toThrow(BadRequestException);
    expect(REPORT_MAX_RANGE_DAYS).toBe(366);
  });
});
