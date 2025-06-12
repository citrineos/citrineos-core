// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';

export interface IVariableAttributeDto extends IBaseDto {
  id: number;
  stationId: string;
  type?: any; // Use AttributeEnumType if available
  dataType: any; // Use DataEnumType if available
  value?: string | null;
  mutability?: any; // Use MutabilityEnumType if available
  persistent: boolean;
  constant: boolean;
  variableId?: any | null; // Use IVariableDto if available
  componentId?: any | null; // Use IComponentDto if available
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
