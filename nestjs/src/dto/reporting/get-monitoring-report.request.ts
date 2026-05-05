// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { MonitoringCriterionEnumType } from '@enums/monitoring-criterion.enum';
import { ComponentVariableType } from '@dto/shared/component-variable.dto';

/** OCPP 2.0.1 / 2.1 GetMonitoringReport request. */

export class GetMonitoringReportRequest {
  @IsNumber()
  requestId: number;

  @IsOptional()
  @IsArray()
  @IsEnum(MonitoringCriterionEnumType, { each: true })
  monitoringCriteria?: MonitoringCriterionEnumType[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentVariableType)
  componentVariable?: ComponentVariableType[];
}
