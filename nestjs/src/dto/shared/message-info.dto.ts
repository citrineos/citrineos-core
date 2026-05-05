// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ComponentType } from '@dto/shared/component.dto';
import { MessageContentType } from '@dto/shared/message-content.dto';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class MessageInfoType {
  @IsNumber()
  id: number;

  @IsString()
  priority: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  startDateTime?: string;

  @IsOptional()
  @IsString()
  endDateTime?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @ValidateNested()
  @Type(() => MessageContentType)
  message: MessageContentType;

  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentType)
  display?: ComponentType;
}
