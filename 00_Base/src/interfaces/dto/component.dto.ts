// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IBaseDto, IEvseTypeDto, IVariableDto } from '../..';

export interface IComponentDto extends IBaseDto {
  id?: number;
  name: string;
  instance?: string | null;
  evse?: IEvseTypeDto;
  evseDatabaseId?: number | null;
  variables?: IVariableDto[];
}
