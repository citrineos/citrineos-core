// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, IsString } from 'class-validator';

/** OCPP 2.0.1 / 2.1 CostUpdated request — periodic cost notification. */

export class CostUpdatedRequest {
  @IsNumber()
  totalCost: number;

  @IsString()
  transactionId: string;
}
