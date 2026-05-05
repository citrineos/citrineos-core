// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ComponentType } from '@dto/shared/component.dto';
import { VariableType } from '@dto/shared/variable.dto';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class ReportDataType {
  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentType)
  component?: ComponentType;

  @IsOptional()
  @ValidateNested()
  @Type(() => VariableType)
  variable?: VariableType;

  @IsOptional()
  @IsArray()
  variableAttribute?: unknown[];

  @IsOptional()
  variableCharacteristics?: unknown;
}
