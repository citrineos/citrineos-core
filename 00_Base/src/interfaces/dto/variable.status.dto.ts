// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto } from './base.dto';
import { IVariableAttributeDto } from './variable.attribute.dto';
import { OCPP2_0_1 } from '../..';

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
