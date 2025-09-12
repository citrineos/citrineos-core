// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from '../..';

export interface ITariffDto extends IBaseDto {
  id?: number;
  stationId: string;
  currency: string;
  pricePerKwh: number;
  pricePerMin?: number | null;
  pricePerSession?: number | null;
  authorizationAmount?: number | null;
  paymentFee?: number | null;
  taxRate?: number | null;
}
