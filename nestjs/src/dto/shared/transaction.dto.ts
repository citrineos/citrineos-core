// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ChargingStateEnumType } from '@enums/charging-state.enum';
import { StopTransactionReasonEnumType } from '@enums/stop-transaction-reason.enum';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class TransactionType {
  @IsString()
  transactionId: string;

  @IsOptional()
  @IsEnum(ChargingStateEnumType)
  chargingState?: ChargingStateEnumType;

  @IsOptional()
  @IsEnum(StopTransactionReasonEnumType)
  stoppedReason?: StopTransactionReasonEnumType;

  @IsOptional()
  @IsNumber()
  remoteStartId?: number;
}
