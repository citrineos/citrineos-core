// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ArrayMinSize, IsArray, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { MessagePriorityEnumType } from '@enums/message-priority.enum';
import { DisplayMessageStateEnumType } from '@enums/message-state.16.enum';

/** OCPP 2.0.1 / 2.1 GetDisplayMessages request. */

export class GetDisplayMessagesRequest {
  @IsNumber()
  requestId: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  id?: number[];

  @IsOptional()
  @IsEnum(MessagePriorityEnumType)
  priority?: MessagePriorityEnumType;

  @IsOptional()
  @IsEnum(DisplayMessageStateEnumType)
  state?: DisplayMessageStateEnumType;
}
