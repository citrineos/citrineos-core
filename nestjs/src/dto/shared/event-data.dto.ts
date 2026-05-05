// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ComponentType } from '@dto/shared/component.dto';
import { VariableType } from '@dto/shared/variable.dto';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class EventDataType {
  @IsNumber()
  eventId: number;

  @IsString()
  timestamp: string;

  @IsString()
  trigger: string;

  @IsString()
  eventNotificationType: string;

  @IsOptional()
  @IsNumber()
  cause?: number;

  @IsOptional()
  @IsString()
  actualValue?: string;

  @IsOptional()
  @IsString()
  techCode?: string;

  @IsOptional()
  @IsString()
  techInfo?: string;

  @IsOptional()
  @IsBoolean()
  cleared?: boolean;

  @IsOptional()
  @IsNumber()
  variableMonitoringId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentType)
  component?: ComponentType;

  @IsOptional()
  @ValidateNested()
  @Type(() => VariableType)
  variable?: VariableType;
}
