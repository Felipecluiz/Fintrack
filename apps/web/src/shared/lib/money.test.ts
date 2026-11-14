import { describe, expect, it } from 'vitest';
import { centsToInput, parseAmountToCents } from './money';

describe('parseAmountToCents', () => {
  it.each([
    ['10', 1000],
    ['10,5', 1050],
    ['1.234,56', 123456],
    ['R$ 2.000,00', 200000],
    ['1234.56', 123456],
    ['0,01', 1],
  ])('parses "%s" as %i cents', (input, cents) => {
    expect(parseAmountToCents(input)).toBe(cents);
  });

  it.each(['', 'abc', '10,123', '-5', '1,2,3'])('rejects "%s"', (input) => {
    expect(parseAmountToCents(input)).toBeNull();
  });
});

describe('centsToInput', () => {
  it('formats cents for an input field', () => {
    expect(centsToInput(123456)).toBe('1234,56');
  });
});
