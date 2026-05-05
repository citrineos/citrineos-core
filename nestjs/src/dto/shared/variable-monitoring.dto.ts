// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { MonitorEnumType } from '@enums/monitor-type.enum';

/**
 * `VariableMonitoringType` — wire shape for a single monitor entry inside
 * a `MonitoringDataType.variableMonitoring[]` array (NotifyMonitoringReport).
 */
export class VariableMonitoringWireType {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsBoolean()
  transaction?: boolean;

  @IsNumber()
  value: number;

  @IsEnum(MonitorEnumType)
  type: MonitorEnumType;

  @IsNumber()
  severity: number;
}
