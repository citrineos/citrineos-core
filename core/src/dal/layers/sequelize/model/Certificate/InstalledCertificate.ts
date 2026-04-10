// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  CertificateUseEnumType,
  HashAlgorithmEnumType,
  InstalledCertificateDto,
  TenantDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1_Namespace, type ChargingStationDto } from '@citrineos/base';
import { BeforeCreate, BeforeUpdate, Column, DataType, Model, Table } from 'sequelize-typescript';

import { Certificate } from './Certificate.js';
import { ChargingStation } from '../Location/ChargingStation.js';

@Table
export class InstalledCertificate extends Model implements InstalledCertificateDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.InstalledCertificate;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare stationPkId?: number;

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

  @Column(DataType.INTEGER)
  declare certificateId?: number | null;

  certificate!: Certificate;

  station?: ChargingStationDto;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

  @BeforeCreate
  static async resolveStationPkId(instance: InstalledCertificate): Promise<void> {
    if (instance.stationPkId == null && instance.stationId && instance.tenantId != null) {
      const station = await ChargingStation.findOne({
        where: { id: instance.stationId, tenantId: instance.tenantId },
        attributes: ['pkId'],
      });
      if (station) {
        instance.stationPkId = station.pkId;
      }
    }
  }

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
