// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * The idToken a remote start authorises a checkout with: the configured prefix and the checkout's
 * id. It is how a transaction the station starts is traced back to the checkout that paid for it,
 * in OCPP 1.6 (idTag, at most 20 characters) and 2.x alike.
 */
export class IdTokens {
  private readonly _pattern: RegExp;

  constructor(private readonly _prefix: string) {
    const escaped = _prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this._pattern = new RegExp(`^${escaped}(\\d{1,12})$`);
  }

  forCheckout(checkoutId: number): string {
    return `${this._prefix}${checkoutId}`;
  }

  /** The checkout id an idToken was issued for, or undefined when this app did not issue it. */
  checkoutIdOf(idToken: string | null | undefined): number | undefined {
    const match = idToken ? this._pattern.exec(idToken) : null;
    return match ? Number(match[1]) : undefined;
  }
}
