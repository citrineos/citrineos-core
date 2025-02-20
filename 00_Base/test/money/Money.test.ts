import { Money } from '../../src/money/Money';
import { Big } from 'big.js';
import { expect } from '@jest/globals';
import { Currency } from '../../src/money/Currency';

describe('money', () => {
  describe('of', () => {
    it.each([
      [0, new Big(0)],
      [0.012345, new Big('0.012345')],
      [0.512921747191123, new Big('0.512921747191123')],
      [0.999999999999999, new Big('0.999999999999999')],
      [11.6, new Big('11.60')],
      [11.6058, new Big('11.6058')],
      [12.1742, new Big('12.1742')],
      [11.89609, new Big('11.89609')],
      [59.8, new Big('59.80')],
      [59.8299, new Big('59.8299')],
      [62.7601, new Big('62.7601')],
      [61.326395, new Big('61.326395')],
      [99.0, new Big('99.00')],
      [99.01, new Big('99.01')],
      [99.99, new Big('99.99')],
      [123.01, new Big('123.01')],
      [1001.999, new Big('1001.999')],
    ] as Array<[number, Big]>)('should instantiate from number', (numberAmount, expectedAmount) => {
      const money = Money.of(numberAmount, 'USD');

      expect(money.amount).toEqual(expectedAmount);
      expect(money.currency.code).toEqual('USD');
    });

    it.each([
      [new Big('0'), new Big(0)],
      [new Big('0.012345'), new Big('0.012345')],
      [new Big('0.512921747191123'), new Big('0.512921747191123')],
      [new Big('0.999999999999999'), new Big('0.999999999999999')],
      [new Big('11.60'), new Big('11.60')],
      [new Big('11.6058'), new Big('11.6058')],
      [new Big('12.1742'), new Big('12.1742')],
      [new Big('11.89609'), new Big('11.89609')],
      [new Big('59.80'), new Big('59.80')],
      [new Big('59.8299'), new Big('59.8299')],
      [new Big('62.7601'), new Big('62.7601')],
      [new Big('61.326395'), new Big('61.326395')],
      [new Big('99.00'), new Big('99.00')],
      [new Big('99.01'), new Big('99.01')],
      [new Big('99.99'), new Big('99.99')],
      [new Big('123.01'), new Big('123.01')],
      [new Big('1001.999'), new Big('1001.999')],
    ] as Array<[Big, Big]>)('should instantiate from Big', (bigAmount, expectedAmount) => {
      const money = Money.of(bigAmount, 'USD');

      expect(money.amount).toEqual(expectedAmount);
      expect(money.currency.code).toEqual('USD');
    });

    it.each([
      ['0', new Big(0)],
      ['0.012345', new Big('0.012345')],
      ['0.512921747191123', new Big('0.512921747191123')],
      ['0.999999999999999', new Big('0.999999999999999')],
      ['11.60', new Big('11.60')],
      ['11.6058', new Big('11.6058')],
      ['12.1742', new Big('12.1742')],
      ['11.89609', new Big('11.89609')],
      ['59.80', new Big('59.80')],
      ['59.8299', new Big('59.8299')],
      ['62.7601', new Big('62.7601')],
      ['61.326395', new Big('61.326395')],
      ['99.00', new Big('99.00')],
      ['99.01', new Big('99.01')],
      ['99.99', new Big('99.99')],
      ['123.01', new Big('123.01')],
      ['1001.999', new Big('1001.999')],
    ] as Array<[string, Big]>)('should instantiate from string', (stringAmount, expectedAmount) => {
      const money = Money.of(stringAmount, 'USD');

      expect(money.amount).toEqual(expectedAmount);
      expect(money.currency.code).toEqual('USD');
    });

    it('should fail when undefined amount', () => {
      const amount: number | undefined = undefined;
      expect(() => Money.of(amount!, 'USD')).toThrow(`Amount has to be defined`);
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      'should fail when invalid amount',
      (amount) => {
        expect(() => Money.of(amount, 'USD')).toThrow(`Invalid money amount: ${amount}`);
      },
    );

    it('should fail when undefined currency', () => {
      const currency: string | undefined = undefined;
      expect(() => Money.of('1.00', currency!)).toThrow(`Currency has to be defined`);
    });

    it.each([
      '',
      '   ',
      'U',
      'US',
      'US ',
      'USd',
      'usd',
      ' USD',
      'USD ',
      ' USD ',
      'AUD',
      'PLN',
      'CHF',
    ])('should fail when unsupported currency', (currency) => {
      expect(() => Money.of('1.00', currency)).toThrow(`Unsupported currency code: ${currency}`);
    });
  });

  describe('amount', () => {
    it.each([
      [Money.USD('0'), new Big('0')],
      [Money.USD('0.1'), new Big('0.1')],
      [Money.USD('0.195'), new Big('0.195')],
      [Money.USD('0.33'), new Big('0.33')],
      [Money.USD('1.00'), new Big('1')],
      [Money.USD('0.0000000001'), new Big('0.0000000001')],
      [Money.USD('-0.0000000001'), new Big('-0.0000000001')],
      [Money.USD('0.012345'), new Big('0.012345')],
      [Money.USD('0.512921747191123'), new Big('0.512921747191123')],
      [Money.USD('0.999999999999999'), new Big('0.999999999999999')],
      [Money.USD('11.60'), new Big('11.60')],
      [Money.USD('11.6058'), new Big('11.6058')],
      [Money.USD('12.1742'), new Big('12.1742')],
      [Money.USD('11.89609'), new Big('11.89609')],
      [Money.USD('59.80'), new Big('59.80')],
      [Money.USD('59.8299'), new Big('59.8299')],
      [Money.USD('62.7601'), new Big('62.7601')],
      [Money.USD('61.326395'), new Big('61.326395')],
      [Money.USD('99.00'), new Big('99')],
      [Money.USD('99.01'), new Big('99.01')],
      [Money.USD('99.99'), new Big('99.99')],
      [Money.USD('123.01'), new Big('123.01')],
      [Money.USD('1001.999'), new Big('1001.999')],
    ] as Array<[Money, Big]>)('should return amount', (money, expectedAmount) => {
      expect(money.amount).toEqual(expectedAmount);
    });
  });

  describe('currency', () => {
    it.each([
      [Money.USD('1.00'), Currency.of('USD')],
      [Money.of('1.00', 'USD'), Currency.of('USD')],
      [Money.of('1.00', Currency.of('USD')), Currency.of('USD')],
      [Money.of('1.00', 'EUR'), Currency.of('EUR')],
      [Money.of('1.00', Currency.of('EUR')), Currency.of('EUR')],
      [Money.of('1.00', 'CAD'), Currency.of('CAD')],
      [Money.of('1.00', Currency.of('CAD')), Currency.of('CAD')],
      [Money.of('1.00', 'GBP'), Currency.of('GBP')],
      [Money.of('1.00', Currency.of('GBP')), Currency.of('GBP')],
    ] as Array<[Money, Currency]>)('should return currency', (money, expectedCurrency) => {
      expect(money.currency).toEqual(expectedCurrency);
    });
  });

  describe('toNumber', () => {
    it.each([
      [Money.USD('0'), 0],
      [Money.USD('0.1'), 0.1],
      [Money.USD('0.195'), 0.195],
      [Money.USD('0.33'), 0.33],
      [Money.USD('1.00'), 1],
      [Money.USD('0.0000000001'), 0.0000000001],
      [Money.USD('-0.0000000001'), -0.0000000001],
      [Money.USD('0.012345'), 0.012345],
      [Money.USD('0.512921747191123'), 0.512921747191123],
      [Money.USD('0.999999999999999'), 0.999999999999999],
      [Money.USD('11.60'), 11.6],
      [Money.USD('11.6058'), 11.6058],
      [Money.USD('12.1742'), 12.1742],
      [Money.USD('11.89609'), 11.89609],
      [Money.USD('59.80'), 59.8],
      [Money.USD('59.8299'), 59.8299],
      [Money.USD('62.7601'), 62.7601],
      [Money.USD('61.326395'), 61.326395],
      [Money.USD('99.00'), 99],
      [Money.USD('99.01'), 99.01],
      [Money.USD('99.99'), 99.99],
      [Money.USD('123.01'), 123.01],
      [Money.USD('1001.999'), 1001.999],
    ] as Array<[Money, number]>)('should return amount as number', (money, expectedNumber) => {
      expect(money.toNumber()).toEqual(expectedNumber);
    });
  });

  describe('roundToCurrencyScale', () => {
    it('should return a new instance', () => {
      const money = Money.of('1.00', 'USD');
      const result = money.roundToCurrencyScale();

      expect(Object.is(money, result)).toBe(false);
    });

    it.each([
      [Money.USD('0'), Money.USD('0')],
      [Money.USD('0.012345'), Money.USD('0.01')],
      [Money.USD('0.512921747191123'), Money.USD('0.51')],
      [Money.USD('0.999999999999999'), Money.USD('0.99')],
      [Money.USD('10.00'), Money.USD('10.00')],
      [Money.USD('11.60'), Money.USD('11.60')],
      [Money.USD('11.6058'), Money.USD('11.60')],
      [Money.USD('12.1742'), Money.USD('12.17')],
      [Money.USD('11.89609'), Money.USD('11.89')],
      [Money.USD('59.80'), Money.USD('59.80')],
      [Money.USD('59.8299'), Money.USD('59.82')],
      [Money.USD('60.00'), Money.USD('60.00')],
      [Money.USD('62.7601'), Money.USD('62.76')],
      [Money.USD('61.326395'), Money.USD('61.32')],
    ])('should round down to currency scale', (money, roundedMoney) => {
      expect(money.roundToCurrencyScale()).toEqual(roundedMoney);
    });
  });

  describe('multiply', () => {
    it('should return a new instance', () => {
      const money = Money.of('1.00', 'USD');
      const result = money.multiply('1.00');

      expect(Object.is(money, result)).toBe(false);
    });

    it.each([
      [Money.USD('0'), '0', Money.USD('0')],
      [Money.USD('0.01'), '0', Money.USD('0')],
      [Money.USD('1'), '0', Money.USD('0')],
      [Money.USD('100'), '0', Money.USD('0')],

      [Money.USD('0.1'), '0.2', Money.USD('0.02')],
      [Money.USD('0.01'), '0.01', Money.USD('0.0001')],
      [Money.USD('0.005'), '0.005', Money.USD('0.000025')],
      [Money.USD('0.0020445'), '0.0005405', Money.USD('0.00000110505225')],
      [Money.USD('0.0000000032'), '0.0014406509', Money.USD('0.00000000000461008288')],
      [Money.USD('0.6970656124'), '0.0098969742', Money.USD('0.00689884038163000008')],

      [Money.USD('1'), '1', Money.USD('1')],
      [Money.USD('1'), '99', Money.USD('99')],
      [Money.USD('1'), '144', Money.USD('144')],
      [Money.USD('1'), '800000', Money.USD('800000')],
      [Money.USD('1'), '9000000000000', Money.USD('9000000000000')],

      [Money.USD('0.58'), '20.00', Money.USD('11.60')],
      [Money.USD('0.58'), '20.01', Money.USD('11.6058')],
      [Money.USD('0.58'), '20.99', Money.USD('12.1742')],
      [Money.USD('0.58'), '20.5105', Money.USD('11.89609')],

      [Money.USD('2.99'), '20.00', Money.USD('59.80')],
      [Money.USD('2.99'), '20.01', Money.USD('59.8299')],
      [Money.USD('2.99'), '20.99', Money.USD('62.7601')],
      [Money.USD('2.99'), '20.5105', Money.USD('61.326395')],

      [Money.USD('1'), '0.00000000000014406509', Money.USD('0.00000000000014406509')],
      [Money.USD('1'), '0.00000000000001', Money.USD('0.00000000000001')],
      [Money.USD('1'), '0.000000003345', Money.USD('0.000000003345')],
      [Money.USD('1'), '0.0001', Money.USD('0.0001')],
      [Money.USD('1'), '0.09', Money.USD('0.09')],
      [Money.USD('1'), '1.02', Money.USD('1.02')],
      [Money.USD('1'), '6.1915', Money.USD('6.1915')],

      [Money.USD('0.1'), '-0.2', Money.USD('-0.02')],
      [Money.USD('0.01'), '-0.01', Money.USD('-0.0001')],
      [Money.USD('0.005'), '-0.005', Money.USD('-0.000025')],

      [Money.USD('1'), '-1', Money.USD('-1')],
      [Money.USD('1'), '-99', Money.USD('-99')],
      [Money.USD('1'), '-144', Money.USD('-144')],
      [Money.USD('1'), '-800000', Money.USD('-800000')],
      [Money.USD('1'), '-9000000000000', Money.USD('-9000000000000')],
    ] as Array<[Money, string, Money]>)(
      'should multiply with high precision',
      (multiplicand, multiplier, expected) => {
        expect(multiplicand.multiply(multiplier)).toEqual(expected);
      },
    );
  });

  describe('add', () => {
    it('should fail when adding different currencies', () => {
      const dollars = Money.of('1.00', 'USD');
      const euros = Money.of('1.00', 'EUR');

      expect(() => dollars.add(euros)).toThrow('Currency mismatch');
    });

    it('should return a new instance', () => {
      const money = Money.of('1.00', 'USD');
      const result = money.add(Money.of('1.00', 'USD'));

      expect(Object.is(money, result)).toBe(false);
    });

    it.each([
      [Money.USD('0'), Money.USD('0'), Money.USD('0')],

      [Money.USD('0.1'), Money.USD('0.2'), Money.USD('0.3')],
      [Money.USD('0.01'), Money.USD('0.01'), Money.USD('0.02')],
      [Money.USD('0.005'), Money.USD('0.005'), Money.USD('0.01')],
      [
        Money.USD('0.00204456882324225'),
        Money.USD('0.00054054406579017'),
        Money.USD('0.00258511288903242'),
      ],
      [
        Money.USD('0.00000000326851523835'),
        Money.USD('0.00000000000014406509'),
        Money.USD('0.00000000326865930344'),
      ],
      [
        Money.USD('0.69706561243525725549'),
        Money.USD('0.00000000000098969742'),
        Money.USD('0.69706561243624695291'),
      ],

      [Money.USD('1'), Money.USD('0'), Money.USD('1')],
      [Money.USD('1'), Money.USD('1'), Money.USD('2')],
      [Money.USD('1'), Money.USD('99'), Money.USD('100')],
      [Money.USD('1'), Money.USD('144'), Money.USD('145')],
      [Money.USD('1'), Money.USD('800000'), Money.USD('800001')],
      [Money.USD('1'), Money.USD('9000000000000'), Money.USD('9000000000001')],

      [Money.USD('1'), Money.USD('0.00000000000014406509'), Money.USD('1.00000000000014406509')],
      [Money.USD('1'), Money.USD('0.00000000000001'), Money.USD('1.00000000000001')],
      [Money.USD('1'), Money.USD('0.000000003345'), Money.USD('1.000000003345')],
      [Money.USD('1'), Money.USD('0.0001'), Money.USD('1.0001')],
      [Money.USD('1'), Money.USD('0.09'), Money.USD('1.09')],
      [Money.USD('1'), Money.USD('1.02'), Money.USD('2.02')],
      [Money.USD('1'), Money.USD('6.1915'), Money.USD('7.1915')],

      [Money.USD('20.00'), Money.USD('9.0091'), Money.USD('29.0091')],
      [Money.USD('20.01'), Money.USD('9.0091'), Money.USD('29.0191')],
      [Money.USD('20.99'), Money.USD('9.0091'), Money.USD('29.9991')],
      [Money.USD('20.9909'), Money.USD('9.0091'), Money.USD('30.00')],

      [Money.USD('20.00'), Money.USD('2.99'), Money.USD('22.99')],
      [Money.USD('20.01'), Money.USD('2.99'), Money.USD('23.00')],
      [Money.USD('20.99'), Money.USD('2.99'), Money.USD('23.98')],

      [
        Money.USD('13455320760120.8707665014'),
        Money.USD('2952858872457.929554397223499'),
        Money.USD('16408179632578.800320898623499'),
      ],
      [
        Money.USD('9936044410052508775.881727897883802'),
        Money.USD('58302388.37179491476'),
        Money.USD('9936044410110811164.253522812643802'),
      ],

      [Money.USD('0.1'), Money.USD('-0.2'), Money.USD('-0.1')],
      [Money.USD('0.01'), Money.USD('-0.01'), Money.USD('0')],
      [Money.USD('0.005'), Money.USD('-0.005'), Money.USD('0')],
      [
        Money.USD('0.00054054406579017'),
        Money.USD('-0.00204456882324225'),
        Money.USD('-0.00150402475745208'),
      ],
      [
        Money.USD('0.00000000000014406509'),
        Money.USD('-0.00000000326851523835'),
        Money.USD('-0.00000000326837117326'),
      ],
      [
        Money.USD('0.00000000000098969742'),
        Money.USD('-0.69706561243525725549'),
        Money.USD('-0.69706561243426755807'),
      ],

      [Money.USD('1'), Money.USD('-1'), Money.USD('0')],
      [Money.USD('1'), Money.USD('-99'), Money.USD('-98')],
      [Money.USD('1'), Money.USD('-144'), Money.USD('-143')],
      [Money.USD('1'), Money.USD('-800000'), Money.USD('-799999')],
      [Money.USD('1'), Money.USD('-9000000000000'), Money.USD('-8999999999999')],

      [Money.USD('1'), Money.USD('-0.00000000000014406509'), Money.USD('0.99999999999985593491')],
      [Money.USD('1'), Money.USD('-0.00000000000001'), Money.USD('0.99999999999999')],
      [Money.USD('1'), Money.USD('-0.000000003345'), Money.USD('0.999999996655')],
      [Money.USD('1'), Money.USD('-0.0001'), Money.USD('0.9999')],
      [Money.USD('1'), Money.USD('-0.09'), Money.USD('0.91')],
      [Money.USD('1'), Money.USD('-1.02'), Money.USD('-0.02')],
      [Money.USD('1'), Money.USD('-6.1915'), Money.USD('-5.1915')],
    ])('should correctly add', (addendA, addendB, expected) => {
      expect(addendA.add(addendB)).toEqual(expected);
    });
  });

  describe('subtract', () => {
    it('should fail when subtracting different currencies', () => {
      const dollars = Money.of('1.00', 'USD');
      const euros = Money.of('1.00', 'EUR');

      expect(() => dollars.subtract(euros)).toThrow('Currency mismatch');
    });

    it('should return a new instance', () => {
      const money = Money.of('1.00', 'USD');
      const result = money.subtract(Money.of('1.00', 'USD'));

      expect(Object.is(money, result)).toBe(false);
    });

    it.each([
      [Money.USD('0'), Money.USD('0'), Money.USD('0')],

      [Money.USD('0.1'), Money.USD('0.2'), Money.USD('-0.1')],
      [Money.USD('0.2'), Money.USD('0.1'), Money.USD('0.1')],
      [Money.USD('0.01'), Money.USD('0.01'), Money.USD('0.00')],
      [Money.USD('0.005'), Money.USD('0.005'), Money.USD('0.00')],
      [
        Money.USD('0.00204456882324225'),
        Money.USD('0.00054054406579017'),
        Money.USD('0.00150402475745208'),
      ],
      [
        Money.USD('0.00000000326851523835'),
        Money.USD('0.00000000000014406509'),
        Money.USD('0.00000000326837117326'),
      ],
      [
        Money.USD('0.69706561243525725549'),
        Money.USD('0.00000000000098969742'),
        Money.USD('0.69706561243426755807'),
      ],

      [Money.USD('1'), Money.USD('0'), Money.USD('1')],
      [Money.USD('1'), Money.USD('1'), Money.USD('0')],
      [Money.USD('1'), Money.USD('99'), Money.USD('-98')],
      [Money.USD('99'), Money.USD('1'), Money.USD('98')],
      [Money.USD('144'), Money.USD('1'), Money.USD('143')],
      [Money.USD('800000'), Money.USD('1'), Money.USD('799999')],
      [Money.USD('9000000000000'), Money.USD('1'), Money.USD('8999999999999')],

      [Money.USD('1'), Money.USD('0.00000000000014406509'), Money.USD('0.99999999999985593491')],
      [Money.USD('1'), Money.USD('0.00000000000001'), Money.USD('0.99999999999999')],
      [Money.USD('1'), Money.USD('0.000000003345'), Money.USD('0.999999996655')],
      [Money.USD('1'), Money.USD('0.0001'), Money.USD('0.9999')],
      [Money.USD('1'), Money.USD('0.09'), Money.USD('0.91')],
      [Money.USD('1'), Money.USD('1.02'), Money.USD('-0.02')],
      [Money.USD('1'), Money.USD('6.1915'), Money.USD('-5.1915')],

      [
        Money.USD('13455320760120.8707665014'),
        Money.USD('2952858872457.929554397223499'),
        Money.USD('10502461887662.941212104176501'),
      ],

      [Money.USD('20.00'), Money.USD('9.0091'), Money.USD('10.9909')],
      [Money.USD('20.01'), Money.USD('9.0091'), Money.USD('11.0009')],
      [Money.USD('20.99'), Money.USD('9.0091'), Money.USD('11.9809')],
      [Money.USD('20.9909'), Money.USD('9.0091'), Money.USD('11.9818')],

      [Money.USD('20.00'), Money.USD('2.99'), Money.USD('17.01')],
      [Money.USD('20.01'), Money.USD('2.99'), Money.USD('17.02')],
      [Money.USD('20.99'), Money.USD('2.99'), Money.USD('18.00')],

      [Money.USD('0.1'), Money.USD('-0.2'), Money.USD('0.3')],
      [Money.USD('0.01'), Money.USD('-0.01'), Money.USD('0.02')],
      [Money.USD('0.005'), Money.USD('-0.005'), Money.USD('0.01')],
      [
        Money.USD('0.00054054406579017'),
        Money.USD('-0.00204456882324225'),
        Money.USD('0.00258511288903242'),
      ],
      [
        Money.USD('0.00000000000014406509'),
        Money.USD('-0.00000000326851523835'),
        Money.USD('0.00000000326865930344'),
      ],
      [
        Money.USD('0.00000000000098969742'),
        Money.USD('-0.69706561243525725549'),
        Money.USD('0.69706561243624695291'),
      ],

      [Money.USD('1'), Money.USD('-1'), Money.USD('2')],
      [Money.USD('1'), Money.USD('-99'), Money.USD('100')],
      [Money.USD('1'), Money.USD('-144'), Money.USD('145')],
      [Money.USD('1'), Money.USD('-800000'), Money.USD('800001')],
      [Money.USD('1'), Money.USD('-9000000000000'), Money.USD('9000000000001')],

      [Money.USD('1'), Money.USD('-0.00000000000014406509'), Money.USD('1.00000000000014406509')],
      [Money.USD('1'), Money.USD('-0.00000000000001'), Money.USD('1.00000000000001')],
      [Money.USD('1'), Money.USD('-0.000000003345'), Money.USD('1.000000003345')],
      [Money.USD('1'), Money.USD('-0.0001'), Money.USD('1.0001')],
      [Money.USD('1'), Money.USD('-0.09'), Money.USD('1.09')],
      [Money.USD('1'), Money.USD('-1.02'), Money.USD('2.02')],
      [Money.USD('1'), Money.USD('-6.1915'), Money.USD('7.1915')],
    ])('should correctly subtract', (minuend, subtrahend, expected) => {
      expect(minuend.subtract(subtrahend)).toEqual(expected);
    });
  });

  describe('equals', () => {
    it('should return false when comparing different currencies', () => {
      const dollars = Money.of('1.00', 'USD');
      const euros = Money.of('1.00', 'EUR');

      expect(dollars.equals(euros)).toEqual(false);
    });

    it.each([
      [Money.USD('0.00'), Money.USD('1.00')],
      [Money.USD('0.00000000000000000001'), Money.USD('0.00000000000000000002')],
      [Money.USD('0.00000000000000000009'), Money.USD('0.00000000000000000010')],
      [Money.USD('0.99'), Money.USD('1.00')],
      [Money.USD('20'), Money.USD('100')],
    ])('should return false when amount is smaller', (money, moreMoney) => {
      expect(money.equals(moreMoney)).toEqual(false);
    });

    it.each([
      [Money.USD('0.00'), Money.USD('0.00')],
      [Money.USD('0.00000000000000000001'), Money.USD('0.00000000000000000001')],
      [Money.USD('0.00000000000000000009'), Money.USD('0.00000000000000000009')],
      [Money.USD('0.99'), Money.USD('0.99')],
      [Money.USD('20'), Money.USD('20.00')],
    ])('should return true when amount is equal', (money, sameMoney) => {
      expect(money.equals(sameMoney)).toEqual(true);
    });

    it.each([
      [Money.USD('1.00'), Money.USD('0.00')],
      [Money.USD('0.00000000000000000002'), Money.USD('0.00000000000000000001')],
      [Money.USD('0.00000000000000000010'), Money.USD('0.00000000000000000009')],
      [Money.USD('1.00'), Money.USD('0.99')],
      [Money.USD('100'), Money.USD('99')],
    ])('should return false when amount is greater', (money, lessMoney) => {
      expect(money.equals(lessMoney)).toEqual(false);
    });
  });

  describe('greaterThan', () => {
    it('should fail when comparing different currencies', () => {
      const dollars = Money.of('1.00', 'USD');
      const euros = Money.of('1.00', 'EUR');

      expect(() => dollars.greaterThan(euros)).toThrow('Currency mismatch');
    });

    it.each([
      [Money.USD('0.00'), Money.USD('1.00')],
      [Money.USD('0.00000000000000000001'), Money.USD('0.00000000000000000002')],
      [Money.USD('0.00000000000000000009'), Money.USD('0.00000000000000000010')],
      [Money.USD('0.99'), Money.USD('1.00')],
      [Money.USD('20'), Money.USD('100')],
    ])('should return false when amount is smaller', (money, moreMoney) => {
      expect(money.greaterThan(moreMoney)).toEqual(false);
    });

    it.each([
      [Money.USD('0.00'), Money.USD('0.00')],
      [Money.USD('0.00000000000000000001'), Money.USD('0.00000000000000000001')],
      [Money.USD('0.00000000000000000009'), Money.USD('0.00000000000000000009')],
      [Money.USD('0.99'), Money.USD('0.99')],
      [Money.USD('20'), Money.USD('20.00')],
    ])('should return false when amount is equal', (money, sameMoney) => {
      expect(money.greaterThan(sameMoney)).toEqual(false);
    });

    it.each([
      [Money.USD('1.00'), Money.USD('0.00')],
      [Money.USD('0.00000000000000000002'), Money.USD('0.00000000000000000001')],
      [Money.USD('0.00000000000000000010'), Money.USD('0.00000000000000000009')],
      [Money.USD('1.00'), Money.USD('0.99')],
      [Money.USD('100'), Money.USD('99')],
    ])('should return true when amount is greater', (money, lessMoney) => {
      expect(money.greaterThan(lessMoney)).toEqual(true);
    });
  });

  describe('greaterThanOrEqual', () => {
    it('should fail when comparing different currencies', () => {
      const dollars = Money.of('1.00', 'USD');
      const euros = Money.of('1.00', 'EUR');

      expect(() => dollars.greaterThanOrEqual(euros)).toThrow('Currency mismatch');
    });

    it.each([
      [Money.USD('0.00'), Money.USD('1.00')],
      [Money.USD('0.00000000000000000001'), Money.USD('0.00000000000000000002')],
      [Money.USD('0.00000000000000000009'), Money.USD('0.00000000000000000010')],
      [Money.USD('0.99'), Money.USD('1.00')],
      [Money.USD('99'), Money.USD('100')],
    ])('should return false when amount is smaller', (money, moreMoney) => {
      expect(money.greaterThanOrEqual(moreMoney)).toEqual(false);
    });

    it.each([
      [Money.USD('0.00'), Money.USD('0.00')],
      [Money.USD('0.00000000000000000001'), Money.USD('0.00000000000000000001')],
      [Money.USD('0.00000000000000000009'), Money.USD('0.00000000000000000009')],
      [Money.USD('0.99'), Money.USD('0.99')],
      [Money.USD('99'), Money.USD('20.00')],
    ])('should return true when amount is equal', (money, sameMoney) => {
      expect(money.greaterThanOrEqual(sameMoney)).toEqual(true);
    });

    it.each([
      [Money.USD('1.00'), Money.USD('0.00')],
      [Money.USD('0.00000000000000000002'), Money.USD('0.00000000000000000001')],
      [Money.USD('0.00000000000000000010'), Money.USD('0.00000000000000000009')],
      [Money.USD('1.00'), Money.USD('0.99')],
      [Money.USD('100'), Money.USD('20')],
    ])('should return true when amount is greater', (money, lessMoney) => {
      expect(money.greaterThanOrEqual(lessMoney)).toEqual(true);
    });
  });

  describe('lessThan', () => {
    it('should fail when comparing different currencies', () => {
      const dollars = Money.of('1.00', 'USD');
      const euros = Money.of('1.00', 'EUR');

      expect(() => dollars.lessThan(euros)).toThrow('Currency mismatch');
    });

    it.each([
      [Money.USD('0.00'), Money.USD('1.00')],
      [Money.USD('0.00000000000000000001'), Money.USD('0.00000000000000000002')],
      [Money.USD('0.00000000000000000009'), Money.USD('0.00000000000000000010')],
      [Money.USD('0.99'), Money.USD('1.00')],
      [Money.USD('99'), Money.USD('100')],
    ])('should return true when amount is smaller', (money, moreMoney) => {
      expect(money.lessThan(moreMoney)).toEqual(true);
    });

    it.each([
      [Money.USD('0.00'), Money.USD('0.00')],
      [Money.USD('0.00000000000000000001'), Money.USD('0.00000000000000000001')],
      [Money.USD('0.00000000000000000009'), Money.USD('0.00000000000000000009')],
      [Money.USD('0.99'), Money.USD('0.99')],
      [Money.USD('99'), Money.USD('20.00')],
    ])('should return false when amount is equal', (money, sameMoney) => {
      expect(money.lessThan(sameMoney)).toEqual(false);
    });

    it.each([
      [Money.USD('1.00'), Money.USD('0.00')],
      [Money.USD('0.00000000000000000002'), Money.USD('0.00000000000000000001')],
      [Money.USD('0.00000000000000000010'), Money.USD('0.00000000000000000009')],
      [Money.USD('1.00'), Money.USD('0.99')],
      [Money.USD('100'), Money.USD('99')],
    ])('should return false when amount is greater', (money, lessMoney) => {
      expect(money.lessThan(lessMoney)).toEqual(false);
    });
  });

  describe('lessThanOrEqual', () => {
    it('should fail when comparing different currencies', () => {
      const dollars = Money.of('1.00', 'USD');
      const euros = Money.of('1.00', 'EUR');

      expect(() => dollars.lessThanOrEqual(euros)).toThrow('Currency mismatch');
    });

    it.each([
      [Money.USD('0.00'), Money.USD('1.00')],
      [Money.USD('0.00000000000000000001'), Money.USD('0.00000000000000000002')],
      [Money.USD('0.00000000000000000009'), Money.USD('0.00000000000000000010')],
      [Money.USD('0.99'), Money.USD('1.00')],
      [Money.USD('99'), Money.USD('100')],
    ])('should return true when amount is smaller', (money, moreMoney) => {
      expect(money.lessThanOrEqual(moreMoney)).toEqual(true);
    });

    it.each([
      [Money.USD('0.00'), Money.USD('0.00')],
      [Money.USD('0.00000000000000000001'), Money.USD('0.00000000000000000001')],
      [Money.USD('0.00000000000000000009'), Money.USD('0.00000000000000000009')],
      [Money.USD('0.99'), Money.USD('0.99')],
      [Money.USD('20'), Money.USD('20.00')],
    ])('should return true when amount is equal', (money, sameMoney) => {
      expect(money.lessThanOrEqual(sameMoney)).toEqual(true);
    });

    it.each([
      [Money.USD('1.00'), Money.USD('0.00')],
      [Money.USD('0.00000000000000000002'), Money.USD('0.00000000000000000001')],
      [Money.USD('0.00000000000000000010'), Money.USD('0.00000000000000000009')],
      [Money.USD('1.00'), Money.USD('0.99')],
      [Money.USD('100'), Money.USD('99')],
    ])('should return false when amount is greater', (money, lessMoney) => {
      expect(money.lessThanOrEqual(lessMoney)).toEqual(false);
    });
  });

  describe('isZero', () => {
    it.each([Money.USD('0')])('should return true when amount is zero', (money) => {
      expect(money.isZero()).toEqual(true);
    });

    it.each([
      Money.USD('0.00000000000000000001'),
      Money.USD('0.005'),
      Money.USD('0.01'),
      Money.USD('1.00'),
      Money.USD('1000.00'),
    ])('should return false when amount is greater than zero', (money) => {
      expect(money.isZero()).toEqual(false);
    });

    it.each([
      Money.USD('-0.00000000000000000001'),
      Money.USD('-0.005'),
      Money.USD('-0.01'),
      Money.USD('-1.00'),
      Money.USD('-99.00'),
      Money.USD('-1000.00'),
    ])('should return false when amount is less than zero', (money) => {
      expect(money.isZero()).toEqual(false);
    });
  });

  describe('isPositive', () => {
    it.each([
      Money.USD('0.00000000000000000001'),
      Money.USD('0.005'),
      Money.USD('0.01'),
      Money.USD('1.00'),
      Money.USD('1000.00'),
    ])('should return true when amount is greater than zero', (money) => {
      expect(money.isPositive()).toEqual(true);
    });

    it.each([
      Money.USD('-0.00000000000000000001'),
      Money.USD('-0.005'),
      Money.USD('-0.01'),
      Money.USD('-1.00'),
      Money.USD('-99.00'),
      Money.USD('-1000.00'),
    ])('should return false when amount is less than zero', (money) => {
      expect(money.isPositive()).toEqual(false);
    });

    it.each([Money.USD('0')])('should return false when amount is equal to zero', (money) => {
      expect(money.isPositive()).toEqual(false);
    });
  });

  describe('isNegative', () => {
    it.each([
      Money.USD('-0.00000000000000000001'),
      Money.USD('-0.005'),
      Money.USD('-0.01'),
      Money.USD('-1.00'),
      Money.USD('-99.00'),
      Money.USD('-1000.00'),
    ])('should return true when amount is less than zero', (money) => {
      expect(money.isNegative()).toEqual(true);
    });

    it.each([
      Money.USD('0.00000000000000000001'),
      Money.USD('0.005'),
      Money.USD('0.01'),
      Money.USD('1.00'),
      Money.USD('1000.00'),
    ])('should return false when amount is greater than zero', (money) => {
      expect(money.isNegative()).toEqual(false);
    });

    it.each([Money.USD('0')])('should return false when amount is equal to zero', (money) => {
      expect(money.isNegative()).toEqual(false);
    });
  });
});
