// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  CertificateUseEnumType,
  HashAlgorithmEnumType,
  InstalledCertificateDto,
  TenantDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1_Namespace } from '@citrineos/base';
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
import { ChargingStation } from '../Location/index.js';
import { Tenant } from '../Tenant.js';
import { Certificate } from './Certificate.js';

@Table
export class InstalledCertificate extends Model implements InstalledCertificateDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.InstalledCertificate;

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare stationId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare hashAlgorithm: HashAlgorithmEnumType;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare issuerNameHash?: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare issuerKeyHash?: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare serialNumber?: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare certificateType: CertificateUseEnumType;

  @ForeignKey(() => Certificate)
  @Column(DataType.INTEGER)
  declare certificateId?: number | null;

  @BelongsTo(() => Certificate)
  certificate!: Certificate;

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
  static setDefaultTenant(instance: InstalledCertificate) {
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
