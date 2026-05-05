// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TransactionEventEnumType } from '@enums/transaction-event.enum';
import { TriggerReasonEnumType } from '@enums/trigger-reason.enum';
import { EVSEType } from '@dto/shared/evse.dto';
import { IdTokenType } from '@dto/shared/id-token.dto';
import { MeterValueType } from '@dto/shared/meter-value.dto';
import { TransactionType } from '@dto/shared/transaction.dto';

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class TransactionEventRequest {
  @IsEnum(TransactionEventEnumType)
  eventType: TransactionEventEnumType;

  @IsString()
  timestamp: string;

  @IsEnum(TriggerReasonEnumType)
  triggerReason: TriggerReasonEnumType;

  @IsNumber()
  seqNo: number;

  @ValidateNested()
  @Type(() => TransactionType)
  transactionInfo: TransactionType;

  @IsOptional()
  @IsBoolean()
  offline?: boolean;

  @IsOptional()
  @IsNumber()
  numberOfPhasesUsed?: number;

  @IsOptional()
  @IsNumber()
  cableMaxCurrent?: number;

  @IsOptional()
  @IsNumber()
  reservationId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => IdTokenType)
  idToken?: IdTokenType;

  @IsOptional()
  @ValidateNested()
  @Type(() => EVSEType)
  evse?: EVSEType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeterValueType)
  meterValue?: MeterValueType[];
}
