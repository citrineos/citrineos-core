// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import type { TenantDto, LocalListAuthorizationDto } from '@citrineos/base';
import { BeforeCreate, BeforeUpdate, Column, DataType, Model, Table } from 'sequelize-typescript';

@Table
export class LocalListVersion extends Model {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.LocalListVersion;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_tenantId',
  })
  declare stationId: string;

  @Column(DataType.INTEGER)
  declare versionNumber: number;

  declare localAuthorizationList?:
    | [LocalListAuthorizationDto, ...LocalListAuthorizationDto[]]
    | undefined;

  customData?: OCPP2_0_1.CustomDataType | null | undefined;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    unique: 'stationId_tenantId',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

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
