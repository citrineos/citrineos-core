import { Currency } from '../../src/money/Currency';
import { expect } from '@jest/globals';

describe('currency', () => {
  describe('of', () => {
    it.each(['', ' ', 'RANDOM', 'USD ', ' USD', 'usd', 'CAD', 'GBP', 'PLN'])(
      'should fail if currency is not supported',
      (currencyCode) => {
        expect(() => Currency.of(currencyCode)).toThrow(
          `Unsupported currency code: ${currencyCode}`,
        );
      },
    );

    it.each([
      ['USD', Currency.USD],
      ['EUR', Currency.EUR],
    ] as Array<[string, Currency]>)(
      'should return currency for currency code',
      (currencyCode, expectedCurrency) => {
        expect(Currency.of(currencyCode)).toEqual(expectedCurrency);
      },
    );
  });

  describe('code', () => {
    it('should return currency code', () => {
      const usd = Currency.of('USD');
      expect(usd.code).toEqual('USD');

      const euro = Currency.of('EUR');
      expect(euro.code).toEqual('EUR');
    });
  });

  describe('scale', () => {
    it('should return currency scale', () => {
      const usd = Currency.of('USD');
      expect(usd.scale).toEqual(2);

      const euro = Currency.of('EUR');
      expect(euro.scale).toEqual(2);
    });
  });
});
