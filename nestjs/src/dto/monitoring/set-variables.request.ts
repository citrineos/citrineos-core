// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { SetVariableDataType } from '@dto/shared/set-variable-data.dto';

/** OCPP 2.0.1 / 2.1 SetVariables request. */

export class SetVariablesRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SetVariableDataType)
  setVariableData: SetVariableDataType[];
}
