// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EventDataType } from '@dto/shared/event-data.dto';

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class NotifyEventRequest {
  @IsString()
  generatedAt: string;

  @IsNumber()
  seqNo: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDataType)
  eventData: EventDataType[];

  @IsOptional()
  @IsBoolean()
  tbc?: boolean;
}
