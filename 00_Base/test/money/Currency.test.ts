import { Currency } from '../../src/money/Currency';
import { expect } from '@jest/globals';

describe('currency', () => {
  describe('of', () => {
    it.each(['', ' ', 'RANDOM', 'USD ', ' USD', 'usd', 'PLN', 'CHF'])(
      'should fail if currency is not supported',
      (currencyCode) => {
        expect(() => Currency.of(currencyCode)).toThrow(
          `Unsupported currency code: ${currencyCode}`,
        );
      },
    );

    it.each([
      ['USD', Currency.of('USD')],
      ['EUR', Currency.of('EUR')],
      ['CAD', Currency.of('CAD')],
      ['GBP', Currency.of('GBP')],
    ] as Array<[string, Currency]>)(
      'should return currency for currency code',
      (currencyCode, expectedCurrency) => {
        expect(Currency.of(currencyCode)).toEqual(expectedCurrency);
      },
    );
  });

  describe('code', () => {
    it.each([
      [Currency.of('USD'), 'USD'],
      [Currency.of('EUR'), 'EUR'],
      [Currency.of('CAD'), 'CAD'],
      [Currency.of('GBP'), 'GBP'],
    ] as Array<[Currency, string]>)('should return currency code', (currency, expectedCode) => {
      expect(currency.code).toEqual(expectedCode);
    });
  });

  describe('scale', () => {
    it.each([
      [Currency.of('USD'), 2],
      [Currency.of('EUR'), 2],
      [Currency.of('CAD'), 2],
      [Currency.of('GBP'), 2],
    ] as Array<[Currency, number]>)('should return currency scale', (currency, expectedScale) => {
      expect(currency.scale).toEqual(expectedScale);
    });
  });
});
