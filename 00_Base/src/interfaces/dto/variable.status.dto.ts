// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IBaseDto } from './base.dto.js';
import type { IVariableAttributeDto } from './variable.attribute.dto.js';
import { OCPP2_0_1 } from '../../index.js';

export interface IVariableStatusDto extends IBaseDto {
  id?: number;
  value: string;
  status: string;
  statusInfo?: OCPP2_0_1.StatusInfoType | null;
  variable: IVariableAttributeDto;
  variableAttributeId?: number | null;
  //   customData?: OCPP2_0_1.CustomDataType | null;
}

export enum VariableStatusDtoProps {
  value = 'value',
  status = 'status',
  statusInfo = 'statusInfo',
  variable = 'variable',
  variableAttributeId = 'variableAttributeId',
  customData = 'customData',
}
