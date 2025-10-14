// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto, IEvseTypeDto, IVariableDto } from '../..';

export interface IComponentDto extends IBaseDto {
  id?: number;
  name: string;
  instance?: string | null;
  evse?: IEvseTypeDto;
  evseDatabaseId?: number | null;
  variables?: IVariableDto[];
}

export enum ComponentDtoProps {
  id = 'id',
  name = 'name',
  instance = 'instance',
  evse = 'evse',
  evseDatabaseId = 'evseDatabaseId',
  variables = 'variables',
}
