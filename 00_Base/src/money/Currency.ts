import { assert } from '../assertion/assertion';

/**
 * ISO-4217 currency codes.
 */
const CURRENCY_CODES = ['USD', 'EUR'] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value);
}

export function currencyCode(value: string): CurrencyCode {
  assert(isCurrencyCode(value), `Unsupported currency code: ${value}`);
  return value;
}

const CURRENCY_SCALES = [2] as const;

/**
 * Represents the scale of the currency.
 *
 * - `2`: The minor unit is 1/100 of the major unit.
 */
type CurrencyScale = (typeof CURRENCY_SCALES)[number];

export function isCurrencyScale(value: number): value is CurrencyScale {
  return (CURRENCY_SCALES as readonly number[]).includes(value);
}

export function currencyScale(value: number): CurrencyScale {
  assert(isCurrencyScale(value), `Unsupported currency scale: ${value}`);
  return value;
}

type CurrencyMap = {
  [K in CurrencyCode]: Currency;
};

/**
 * Represents a currency with decimal precision.
 *
 */
export class Currency {
  public static readonly USD: Currency = new Currency('USD', 2);
  public static readonly EUR: Currency = new Currency('EUR', 2);

  private static readonly SUPPORTED_CURRENCIES: CurrencyMap = {
    USD: Currency.USD,
    EUR: Currency.EUR,
  };

  private readonly _code: CurrencyCode;
  private readonly _scale: CurrencyScale;

  constructor(code: string | CurrencyCode, scale: number | CurrencyScale) {
    this._code = currencyCode(code);
    this._scale = currencyScale(scale);
  }

  get code() {
    return this._code;
  }

  get scale() {
    return this._scale;
  }

  static of(code: string) {
    assert(isCurrencyCode(code), `Unsupported currency code: ${code}`);
    const currency = Currency.SUPPORTED_CURRENCIES[code];
    if (currency === undefined) {
      throw Error(`${code} currency is not supported`);
    }
    return currency;
  }
}
