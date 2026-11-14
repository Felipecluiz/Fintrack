import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/shared/CalendarDate';
import { ValidationError } from '../../src/domain/shared/errors';
import { Money } from '../../src/domain/shared/Money';

describe('CalendarDate', () => {
  it('accepts a valid calendar date', () => {
    expect(CalendarDate.parse('2024-02-29').toString()).toBe('2024-02-29');
  });

  it.each(['2026-02-30', '2026-13-01', '2026-1-5', '05/11/2026', ''])(
    'AC-203: rejects "%s"',
    (raw) => {
      expect(() => CalendarDate.parse(raw)).toThrow(ValidationError);
    },
  );

  it('exposes the month as YYYY-MM', () => {
    expect(CalendarDate.parse('2026-07-15').month).toBe('2026-07');
  });

  it('compares dates chronologically', () => {
    const earlier = CalendarDate.parse('2026-01-31');
    const later = CalendarDate.parse('2026-02-01');
    expect(later.isAfter(earlier)).toBe(true);
    expect(earlier.isAfter(later)).toBe(false);
  });
});

describe('Money', () => {
  it('BR-201: only accepts whole cents', () => {
    expect(() => Money.fromCents(10.5)).toThrow(ValidationError);
  });

  it('adds and subtracts without floating point drift', () => {
    const total = Money.fromCents(10).add(Money.fromCents(20)).subtract(Money.fromCents(5));
    expect(total.cents).toBe(25);
  });
});
