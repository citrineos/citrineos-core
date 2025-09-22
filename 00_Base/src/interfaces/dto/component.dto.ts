// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { IBaseDto, IEvseTypeDto, IVariableDto } from '../../index.js';

export interface IComponentDto extends IBaseDto {
  id?: number;
  name: string;
  instance?: string | null;
  evse?: IEvseTypeDto;
  evseDatabaseId?: number | null;
  variables?: IVariableDto[];
}
