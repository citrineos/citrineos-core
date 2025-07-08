// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
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
