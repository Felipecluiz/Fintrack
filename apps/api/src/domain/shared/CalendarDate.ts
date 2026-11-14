import { ValidationError } from './errors';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Uma data de calendário sem hora nem fuso (YYYY-MM-DD).
 * Strings ISO nesse formato ordenam corretamente como texto, o que simplifica
 * comparações e consultas no banco.
 */
export class CalendarDate {
  private constructor(private readonly value: string) {}

  static parse(raw: string): CalendarDate {
    if (!ISO_DATE.test(raw) || !CalendarDate.existsOnCalendar(raw)) {
      throw new ValidationError(`"${raw}" is not a valid date (expected YYYY-MM-DD)`);
    }
    return new CalendarDate(raw);
  }

  static fromDate(date: Date): CalendarDate {
    return new CalendarDate(date.toISOString().slice(0, 10));
  }

  /** YYYY-MM */
  get month(): string {
    return this.value.slice(0, 7);
  }

  isAfter(other: CalendarDate): boolean {
    return this.value > other.value;
  }

  equals(other: CalendarDate): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private static existsOnCalendar(raw: string): boolean {
    const date = new Date(`${raw}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(raw);
  }
}
