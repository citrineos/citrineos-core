// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber, IsString } from 'class-validator';
import { ConnectorStatusEnumType } from '@enums/connector-status.enum';

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class StatusNotificationRequest {
  @IsString()
  timestamp: string;

  @IsEnum(ConnectorStatusEnumType)
  connectorStatus: ConnectorStatusEnumType;

  @IsNumber()
  evseId: number;

  @IsNumber()
  connectorId: number;
}
