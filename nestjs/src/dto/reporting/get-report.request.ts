// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { ComponentCriterionEnumType } from '@enums/component-criterion.enum';
import { ComponentVariableType } from '@dto/shared/component-variable.dto';

/** OCPP 2.0.1 / 2.1 GetReport request. */

export class GetReportRequest {
  @IsNumber()
  requestId: number;

  @IsOptional()
  @IsArray()
  @IsEnum(ComponentCriterionEnumType, { each: true })
  componentCriteria?: ComponentCriterionEnumType[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentVariableType)
  componentVariable?: ComponentVariableType[];
}
