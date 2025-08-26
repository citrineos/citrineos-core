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
  Table,
} from 'sequelize-typescript';
import { LocalListVersion } from './LocalListVersion.js';
import { LocalListAuthorization } from './LocalListAuthorization.js';
import { Tenant } from '../Tenant.js';
import { DEFAULT_TENANT_ID, ITenantDto } from '@citrineos/base';

@Table
export class LocalListVersionAuthorization extends Model {
  // Namespace enum not used as this is not a model required by CitrineOS
  static readonly MODEL_NAME: string = 'LocalListVersionAuthorization';

  @ForeignKey(() => LocalListVersion)
  @Column(DataType.INTEGER)
  declare localListVersionId: number;

  @ForeignKey(() => LocalListAuthorization)
  @Column(DataType.INTEGER)
  declare authorizationId: number;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: ITenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: LocalListVersionAuthorization) {
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
