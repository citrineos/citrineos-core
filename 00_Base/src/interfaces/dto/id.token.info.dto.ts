// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IBaseDto } from './base.dto';

export interface IIdTokenInfoDto extends IBaseDto {
  id: number;
  status: any;
  cacheExpiryDateTime?: Date;
  chargingPriority?: number;
  language1?: string;
  language2?: string;
  groupIdTokenId?: number;
  personalMessage?: string;
}

export enum IdTokenInfoDtoProps {
  id = 'id',
  status = 'status',
  cacheExpiryDateTime = 'cacheExpiryDateTime',
  chargingPriority = 'chargingPriority',
  language1 = 'language1',
  language2 = 'language2',
  groupIdTokenId = 'groupIdTokenId',
  personalMessage = 'personalMessage',
}
