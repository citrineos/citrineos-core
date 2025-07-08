// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto, IComponentDto, IVariableAttributeDto, IVariableCharacteristicsDto } from '../..';

export interface IVariableDto extends IBaseDto {
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
