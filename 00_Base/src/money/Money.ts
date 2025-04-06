/* eslint-disable @typescript-eslint/no-unused-vars */
import { Currency, CurrencyCode } from './Currency';
import { Big } from 'big.js';
import { assert, notNull } from '../assertion/assertion';

export type CurrencySource = string | CurrencyCode | Currency;

export class Money {
  private readonly _amount: Big;
  private readonly _currency: Currency;

  private constructor(amount: number | string | Big, currency: CurrencySource) {
    assert(notNull(amount), 'Amount has to be defined');
    assert(notNull(currency), 'Currency has to be defined');
    try {
      this._amount = new Big(amount);
    } catch (error) {
      throw new Error(`Invalid money amount: ${amount}`);
    }
    this._currency = typeof currency === 'string' ? Currency.of(currency) : currency;
  }

  get amount(): Big {
    return this._amount;
  }

  get currency(): Currency {
    return this._currency;
  }

  static of(amount: number | string | Big, currency: CurrencySource): Money {
    return new Money(amount, currency);
  }

  static USD(amount: number | string | Big) {
    return new Money(amount, 'USD');
  }

  toNumber(): number {
    return this._amount.toNumber();
  }

  /**
   * Rounds the amount down to match the currency's defined scale.
   * This method could be used when converting an amount to its final monetary value.
   *
   * @returns {Money} A new Money instance with the amount rounded down to the currency's scale.
   */
  roundToCurrencyScale(): Money {
    const newAmount = this._amount.round(
      this.currency.scale,
      0, // RoundDown
    );
    return this.withAmount(newAmount);
  }

  multiply(multiplier: number | string | Big): Money {
    return this.withAmount(this.amount.times(multiplier));
  }

  add(money: Money): Money {
    this.requireSameCurrency(money);
    return this.withAmount(this.amount.plus(money.amount));
  }

  subtract(money: Money): Money {
    this.requireSameCurrency(money);
    return this.withAmount(this.amount.minus(money.amount));
  }

  equals(money: Money): boolean {
    return this._currency === money._currency && this.amount.eq(money.amount);
  }

  greaterThan(money: Money): boolean {
    this.requireSameCurrency(money);
    return this.amount.gt(money.amount);
  }

  greaterThanOrEqual(money: Money): boolean {
    this.requireSameCurrency(money);
    return this.amount.gte(money.amount);
  }

  lessThan(money: Money): boolean {
    this.requireSameCurrency(money);
    return this.amount.lt(money.amount);
  }

  lessThanOrEqual(money: Money): boolean {
    this.requireSameCurrency(money);
    return this.amount.lte(money.amount);
  }

  isZero(): boolean {
    return this.amount.eq(0);
  }

  isPositive(): boolean {
    return this.amount.gt(0);
  }

  isNegative(): boolean {
    return this.amount.lt(0);
  }

  private withAmount(amount: Big): Money {
    return new Money(amount, this._currency);
  }

  private requireSameCurrency(money: Money) {
    assert(this.currency.code === money.currency.code, 'Currency mismatch');
  }
}
