// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { ComponentType } from '@dto/shared/component.dto';
import { VariableType } from '@dto/shared/variable.dto';

/**
 * `ComponentVariable` — pair used by GetReport / GetMonitoringReport to
 * scope what the charger should report.
 */
export class ComponentVariableType {
  @ValidateNested()
  @Type(() => ComponentType)
  component: ComponentType;

  @IsOptional()
  @ValidateNested()
  @Type(() => VariableType)
  variable?: VariableType;
}
