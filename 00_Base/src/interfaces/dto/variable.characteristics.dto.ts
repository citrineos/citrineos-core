// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto, IVariableDto } from '../..';

export interface IVariableCharacteristicsDto extends IBaseDto {
  id?: number;
  unit?: string | null;
  dataType: any;
  minLimit?: number | null;
  maxLimit?: number | null;
  valuesList?: string | null;
  supportsMonitoring: boolean;
  variable: IVariableDto;
  variableId?: number | null;
}

export enum VariableCharacteristicsDtoProps {
  id = 'id',
  unit = 'unit',
  dataType = 'dataType',
  minLimit = 'minLimit',
  maxLimit = 'maxLimit',
  valuesList = 'valuesList',
  supportsMonitoring = 'supportsMonitoring',
  variable = 'variable',
  variableId = 'variableId',
}
