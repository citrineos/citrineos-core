// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffDto } from '@citrineos/types';

export class TariffClass implements Partial<TariffDto> {
  id?: number;
  currency!: string;
  pricePerKwh!: number;
  pricePerMin?: number | null;
  pricePerSession?: number | null;
  authorizationAmount?: number | null;
  paymentFee?: number | null;
  taxRate?: number | null;
  tariffAltText?: Record<string, any> | null;
}
