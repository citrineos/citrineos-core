// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';
import { IComponentDto } from './component.dto';
import { IVariableDto } from './variable.dto';
import { AttributeEnumType, DataEnumType, MutabilityEnumType } from '../../ocpp/model/2.0.1';

export interface IVariableAttributeDto extends IBaseDto {
  id: number;
  stationId: string;
  type?: AttributeEnumType;
  dataType: DataEnumType;
  value?: string | null;
  mutability?: MutabilityEnumType;
  persistent: boolean;
  constant: boolean;
  variableId?: IVariableDto | null;
  componentId?: IComponentDto | null;
  evseDatabaseId?: number | null;
  generatedAt?: string;
}

export enum VariableAttributeDtoProps {
  id = 'id',
  stationId = 'stationId',
  type = 'type',
  dataType = 'dataType',
  value = 'value',
  mutability = 'mutability',
  persistent = 'persistent',
  constant = 'constant',
  variableId = 'variableId',
  componentId = 'componentId',
  evseDatabaseId = 'evseDatabaseId',
  generatedAt = 'generatedAt',
}
