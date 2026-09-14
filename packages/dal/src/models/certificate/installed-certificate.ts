// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  CertificateDto,
  CertificateUseEnumType,
  HashAlgorithmEnumType,
  InstalledCertificateDto,
  TenantDto,
  ChargingStationDto,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, OCPP2_Namespace } from '@citrineos/base';
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

import { ChargingStation } from '../location/index.js';
import { Tenant } from '../tenant.js';
import { Certificate } from './certificate.js';

@Table
export class InstalledCertificate extends Model implements InstalledCertificateDto {
  static readonly MODEL_NAME: string = OCPP2_Namespace.InstalledCertificate;

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare stationId?: number;

  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare ocppConnectionName: string;

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

  @BelongsTo(() => Certificate, 'certificateId')
  declare certificate?: CertificateDto;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare station?: ChargingStationDto;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
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
