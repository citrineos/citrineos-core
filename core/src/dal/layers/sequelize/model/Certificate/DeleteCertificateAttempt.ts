// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  BeforeCreate,
  BeforeUpdate,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import {
  DEFAULT_TENANT_ID,
  OCPP2_0_1,
  OCPP2_0_1_Namespace,
  type TenantDto,
  type ChargingStationDto,
} from '@citrineos/base';
import { ChargingStation } from '../Location/index.js';

@Table
export class DeleteCertificateAttempt extends Model {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.DeleteCertificateAttempt;

  @ForeignKey(() => ChargingStation)
  @Column(DataType.INTEGER)
  declare stationPkId?: number;

  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare stationId: string;

  station?: ChargingStationDto;

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

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

  @BeforeCreate
  static async resolveStationPkId(instance: DeleteCertificateAttempt): Promise<void> {
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
