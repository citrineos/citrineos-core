// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, IsOptional, IsString } from 'class-validator';

/** OCPP 1.6 StartTransaction request. */

export class StartTransactionRequest {
  @IsNumber()
  connectorId: number;

  @IsString()
  idTag: string;

  @IsNumber()
  meterStart: number;

  @IsString()
  timestamp: string;

  @IsNumber()
  @IsOptional()
  reservationId?: number;
}
