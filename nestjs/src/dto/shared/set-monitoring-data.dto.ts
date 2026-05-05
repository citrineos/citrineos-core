// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { MonitorEnumType } from '@enums/monitor-type.enum';
import { ComponentType } from '@dto/shared/component.dto';
import { VariableType } from '@dto/shared/variable.dto';

/** Single entry in a SetVariableMonitoring request. */

export class SetMonitoringDataType {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsBoolean()
  transaction?: boolean;

  @IsNumber()
  value: number;

  @IsEnum(MonitorEnumType)
  type: MonitorEnumType;

  @IsNumber()
  severity: number;

  @ValidateNested()
  @Type(() => ComponentType)
  component: ComponentType;

  @ValidateNested()
  @Type(() => VariableType)
  variable: VariableType;
}
