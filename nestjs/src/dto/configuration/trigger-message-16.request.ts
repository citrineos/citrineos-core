// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { MessageTrigger16 } from '@enums/message-trigger-16.enum';

/**
 * OCPP 1.6 TriggerMessage request. Smaller `requestedMessage` enum than
 * 2.0.1, and `connectorId` is flat (no `evse` envelope).
 */
export class TriggerMessage16Request {
  @IsEnum(MessageTrigger16)
  requestedMessage: MessageTrigger16;

  @IsOptional()
  @IsNumber()
  connectorId?: number;
}
