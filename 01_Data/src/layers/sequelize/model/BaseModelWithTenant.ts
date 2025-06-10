// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
} from 'sequelize-typescript';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { Tenant } from './Tenant';

export abstract class BaseModelWithTenant<
  TModelAttributes extends {} = any,
  TCreationAttributes extends {} = TModelAttributes,
> extends Model<TModelAttributes, TCreationAttributes> {
  @ForeignKey(() => lazyLoadModel<typeof Tenant>('Tenant'))
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE', // update tenantId if the tenant primary key is updated (should never happen)
    onDelete: 'RESTRICT', // ensure tenant row cannot be deleted if there are existing records using it
  })
  declare tenantId: number;

  @BelongsTo(() => lazyLoadModel<typeof Tenant>('Tenant'))
  declare tenant?: Tenant;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: BaseModelWithTenant) {
    if (instance.tenantId == null) {
      instance.tenantId = DEFAULT_TENANT_ID;
    }
  }

  constructor(...args: any[]) {
    super(...args);
    if (this.tenantId == null) {
      this.tenantId = DEFAULT_TENANT_ID;
    }
  }
}

// helper method to dynamically lazy load models to avoid circular dependencies
export function lazyLoadModel<T>(modelName: string): T {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(`./${modelName}`)[modelName] as T;
}
