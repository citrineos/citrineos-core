// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ComponentType } from '@dto/shared/component.dto';
import { VariableType } from '@dto/shared/variable.dto';
import { VariableMonitoringWireType } from '@dto/shared/variable-monitoring.dto';

/**
 * Single entry in a `NotifyMonitoringReport.monitor[]` payload.
 *
 * `component` + `variable` identify what's being monitored;
 * `variableMonitoring[]` carries one or more configured monitor entries
 * (threshold, delta, periodic) with their current values and severity.
 */
export class MonitoringDataType {
  @ValidateNested()
  @Type(() => ComponentType)
  component: ComponentType;

  @ValidateNested()
  @Type(() => VariableType)
  variable: VariableType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariableMonitoringWireType)
  variableMonitoring?: VariableMonitoringWireType[];
}
