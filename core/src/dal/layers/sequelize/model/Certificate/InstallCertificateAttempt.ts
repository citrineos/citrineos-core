// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  DEFAULT_TENANT_ID,
  OCPP2_Namespace,
  type CertificateDto,
  type CertificateUseEnumType,
  type ChargingStationDto,
  type InstallCertificateStatusEnumType,
  type TenantDto,
} from '@citrineos/base';
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
export class InstallCertificateAttempt extends Model {
  static readonly MODEL_NAME: string = OCPP2_Namespace.InstallCertificateAttempt;

  @ForeignKey(() => ChargingStation)
  @Column(DataType.INTEGER)
  declare stationPkId?: number;

  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare stationId: string;

  @BelongsTo(() => ChargingStation, 'stationPkId')
  declare station?: ChargingStationDto;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare certificateType: CertificateUseEnumType;

  @ForeignKey(() => Certificate)
  @Column({
    type: DataType.INTEGER,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  declare certificateId: number;

  @BelongsTo(() => Certificate, 'certificateId')
  declare certificate?: CertificateDto;

  @Column({
    type: DataType.STRING,
  })
  declare status?: InstallCertificateStatusEnumType | null;

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

  @BeforeCreate
  static async resolveStationPkId(instance: InstallCertificateAttempt): Promise<void> {
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
  static setDefaultTenant(instance: InstallCertificateAttempt) {
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
