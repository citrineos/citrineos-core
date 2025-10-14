// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ITenantDto } from '../..';

export interface IBaseDto {
  tenantId: number;
  tenant?: ITenantDto;
  updatedAt?: Date;
  createdAt?: Date;
}

export enum BaseDtoProps {
  tenantId = 'tenantId',
  updatedAt = 'updatedAt',
  createdAt = 'createdAt',
}
