// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsBoolean, IsNumber, IsString } from 'class-validator';

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class NotifyCustomerInformationRequest {
  @IsString()
  data: string;

  @IsBoolean()
  tbc: boolean;

  @IsNumber()
  seqNo: number;

  @IsString()
  generatedAt: string;

  @IsNumber()
  requestId: number;
}
