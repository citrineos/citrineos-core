// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, OCPP2_Namespace } from '@citrineos/base';
import type {
  ChargingStationDto,
  ChargingStationSecurityInfoDto,
  TenantDto,
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
import { ChargingStation } from './Location/index.js';
import { Tenant } from './Tenant.js';

/**
 * Represents the security information found on a particular charging station.
 */
@Table
export class ChargingStationSecurityInfo extends Model implements ChargingStationSecurityInfoDto {
  static readonly MODEL_NAME: string = OCPP2_Namespace.ChargingStationSecurityInfo;

  @ForeignKey(() => ChargingStation)
  @Column(DataType.INTEGER)
  declare stationPkId?: number;

  @BelongsTo(() => ChargingStation, 'stationPkId')
  declare chargingStation?: ChargingStationDto;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_tenantId',
  })
  stationId!: string;

  @Column(DataType.STRING)
  publicKeyFileId!: string;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    unique: 'stationId_tenantId',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
  declare tenant?: TenantDto;

  @BeforeCreate
  static async resolveStationPkId(instance: ChargingStationSecurityInfo): Promise<void> {
    if (instance.stationPkId == null && instance.stationId && instance.tenantId != null) {
      const { ChargingStation } = await import('./Location/ChargingStation.js');
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
  static setDefaultTenant(instance: ChargingStationSecurityInfo) {
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
