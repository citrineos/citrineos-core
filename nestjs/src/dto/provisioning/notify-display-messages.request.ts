// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { MessageInfoType } from '@dto/shared/message-info.dto';

/**
 * NotifyDisplayMessages request — OCPP 2.0.1 / 2.1.
 *
 * Wire field is `messageInfo` (an array of MessageInfoType, each describing
 * a message currently configured on the charger's display). `tbc` ("to be
 * continued") indicates more parts will follow in subsequent
 * NotifyDisplayMessages calls — the charger streams its catalog when it
 * exceeds a single payload.
 */
export class NotifyDisplayMessagesRequest {
  @IsNumber()
  requestId: number;

  @IsOptional()
  @IsBoolean()
  tbc?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageInfoType)
  messageInfo?: MessageInfoType[];
}
