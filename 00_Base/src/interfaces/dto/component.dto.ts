// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto, IEvseDto, IVariableDto } from '../..';

export interface IComponentDto extends IBaseDto {
  id?: number;
  name: string;
  instance?: string | null;
  evse?: IEvseDto;
  evseDatabaseId?: number | null;
  variables?: IVariableDto[];
}
