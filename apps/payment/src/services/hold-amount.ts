// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffData } from '@citrineos/dal';
import { toMinorUnits } from '../pricing/index.js';
import { PaymentError, PaymentErrorCode } from './errors.js';

/** What a session on this tariff holds on the driver's card, in minor units. */
export function holdAmountOf(tariff: TariffData): number {
  if (!tariff.authorizationAmount || tariff.authorizationAmount <= 0) {
    throw new PaymentError(
      PaymentErrorCode.NotPayable,
      `Tariff ${tariff.id} has no authorization amount`,
    );
  }
  try {
    return toMinorUnits(tariff.authorizationAmount, tariff.currency);
  } catch (error) {
    throw new PaymentError(PaymentErrorCode.NotPayable, `Tariff ${tariff.id}: ${String(error)}`);
  }
}
