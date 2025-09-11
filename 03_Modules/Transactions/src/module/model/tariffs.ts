// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export class UpsertTariffRequest {
  id!: number;
  currency!: string;

  pricePerKwh!: number;
  pricePerMin?: number;
  pricePerSession?: number;
  taxRate?: number;

  authorizationAmount?: number;
  paymentFee?: number;
}
