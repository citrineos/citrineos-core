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
  @Column({
    type: DataType.STRING,
    unique: true,
  })
  stationId!: string;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation?: ChargingStationDto;

  @Column(DataType.STRING)
  publicKeyFileId!: string;

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
