// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  IBaseDto,
  IComponentDto,
  IVariableAttributeDto,
  IVariableCharacteristicsDto,
  OCPP2_0_1,
} from '../..';

export interface IVariableDto extends IBaseDto, OCPP2_0_1.VariableType {
  id?: number;
  name: string;
  instance?: string | null;
  components?: IComponentDto[];
  variableAttributes?: IVariableAttributeDto[];
  variableCharacteristics?: IVariableCharacteristicsDto;
}

export enum VariableDtoProps {
  id = 'id',
  name = 'name',
  instance = 'instance',
  components = 'components',
  variableAttributes = 'variableAttributes',
  variableCharacteristics = 'variableCharacteristics',
}
