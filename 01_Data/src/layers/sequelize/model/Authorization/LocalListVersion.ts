// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { DEFAULT_TENANT_ID, ITenantDto, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { LocalListAuthorization } from './index.js';
import { LocalListVersionAuthorization } from './LocalListVersionAuthorization.js';
import { Tenant } from '../Tenant.js';

@Table
export class LocalListVersion extends Model {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.LocalListVersion;

  @Column({
    unique: true,
  })
  declare stationId: string;

  @Column(DataType.INTEGER)
  declare versionNumber: number;

  @BelongsToMany(() => LocalListAuthorization, () => LocalListVersionAuthorization)
  declare localAuthorizationList?:
    | [LocalListAuthorization, ...LocalListAuthorization[]]
    | undefined;

  customData?: OCPP2_0_1.CustomDataType | null | undefined;

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
  static setDefaultTenant(instance: LocalListVersion) {
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
