// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ChargingStationSequenceTypeEnumType, TenantDto } from '@citrineos/types';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
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
import type { ChargingStation as ChargingStationType } from '../location/index.js';
import { Tenant } from '../tenant.js';

@Table
export class ChargingStationSequence extends Model {
  static readonly MODEL_NAME: string = 'ChargingStationSequence';

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: 'stationId_type',
  })
  declare stationId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: 'stationId_type',
  })
  type!: ChargingStationSequenceTypeEnumType;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    defaultValue: 0,
  })
  value!: number;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare station: ChargingStationType;

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
  static setDefaultTenant(instance: ChargingStationSequence) {
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
