// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
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
import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPP2_0_1_Namespace, type TenantDto } from '@citrineos/base';
import { ChargingStation } from '../Location/index.js';
import { Tenant } from '../Tenant.js';

@Table
export class DeleteCertificateAttempt extends Model {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.DeleteCertificateAttempt;

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare stationId: string;

  @BelongsTo(() => ChargingStation)
  station?: ChargingStation;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare hashAlgorithm: OCPP2_0_1.HashAlgorithmEnumType;

  @Column(DataType.STRING)
  declare issuerNameHash: string;

  @Column(DataType.STRING)
  declare issuerKeyHash: string;

  @Column(DataType.STRING)
  declare serialNumber: string;

  @Column({
    type: DataType.STRING,
  })
  declare status?: OCPP2_0_1.DeleteCertificateStatusEnumType | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: DeleteCertificateAttempt) {
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
