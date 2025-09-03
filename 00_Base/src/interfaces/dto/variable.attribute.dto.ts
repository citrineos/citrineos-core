// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  IBaseDto,
  IBootDto,
  IChargingStationDto,
  IComponentDto,
  IEvseTypeDto,
  IVariableDto,
  IVariableStatusDto,
} from '../..';

export interface IVariableAttributeDto extends IBaseDto {
  id?: number;
  stationId: string;
  chargingStation: IChargingStationDto;
  type?: any;
  dataType: any;
  value?: string | null;
  mutability?: any;
  persistent?: boolean | null;
  constant?: boolean | null;
  generatedAt: string;
  variable: IVariableDto;
  variableId?: number | null;
  component: IComponentDto;
  componentId?: number | null;
  evse?: IEvseTypeDto;
  evseDatabaseId?: number | null;
  statuses?: IVariableStatusDto[];
  bootConfig?: IBootDto;
  bootConfigId?: string | null;
}

export enum VariableAttributeDtoProps {
  id = 'id',
  stationId = 'stationId',
  chargingStation = 'chargingStation',
  type = 'type',
  dataType = 'dataType',
  value = 'value',
  mutability = 'mutability',
  persistent = 'persistent',
  constant = 'constant',
  generatedAt = 'generatedAt',
  variable = 'variable',
  variableId = 'variableId',
  component = 'component',
  componentId = 'componentId',
  evse = 'evse',
  evseDatabaseId = 'evseDatabaseId',
  statuses = 'statuses',
  bootConfig = 'bootConfig',
  bootConfigId = 'bootConfigId',
}
