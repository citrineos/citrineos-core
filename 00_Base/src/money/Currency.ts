import { assert } from '../assertion/assertion';

/**
 * ISO-4217 currency codes.
 */
const CURRENCY_CODES = ['USD', 'CAD', 'EUR', 'PLN'] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value);
}

export function currencyCode(value: string): CurrencyCode {
  assert(isCurrencyCode(value), `Invalid currency code: ${value}`);
  return value;
}

type CurrencyScale = 0 | 1 | 2 | 3;

type CurrencyMap = {
  [K in CurrencyCode]: Currency;
};

/**
 * Represents a currency with decimal precision.
 *
 */
export class Currency {
  private static readonly SUPPORTED_SCALES = [0, 1, 2, 3];

  /**
   * United States dollar.
   */
  public static readonly USD: Currency = new Currency('USD', 2);

  /**
   * Canadian dollar.
   */
  public static readonly CAD: Currency = new Currency('CAD', 2);

  /**
   * Euro.
   */
  public static readonly EUR: Currency = new Currency('EUR', 2);

  /**
   * Polish złoty.
   */
  public static readonly PLN: Currency = new Currency('PLN', 2);

  private static readonly SUPPORTED_CURRENCIES: CurrencyMap = {
    USD: Currency.USD,
    CAD: Currency.CAD,
    EUR: Currency.EUR,
    PLN: Currency.PLN,
  };

  /**
   * ISO-4217 currency code.
   */
  private readonly _code: CurrencyCode;

  /**
   * Represents the scale of the currency.
   *
   * - `0`: No minor units are used for this currency.
   * - `1`: The minor unit is 1/10 of the major unit.
   * - `2`: The minor unit is 1/100 of the major unit.
   * - `3`: The minor unit is 1/1000 of the major unit.
   */
  private readonly _scale: CurrencyScale;

  constructor(code: CurrencyCode, scale: CurrencyScale) {
    assert(isCurrencyCode(code), `${code} currency is not supported`);
    assert(
      [0, 1, 2, 3].includes(scale),
      `Scale has to be one of ${Currency.SUPPORTED_SCALES}`,
    );
    this._code = code;
    this._scale = scale;
  }

  static of(code: string) {
    assert(isCurrencyCode(code), `${code} currency is not supported`);
    const currency = Currency.SUPPORTED_CURRENCIES[code];
    if (currency === undefined) {
      throw Error(`${code} currency is not supported`);
    }
    return currency;
  }

  get code() {
    return this._code;
  }

  get scale() {
    return this._scale;
  }
}
