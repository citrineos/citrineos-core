// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ChargingStationSequenceTypeEnumType, TenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { BeforeCreate, BeforeUpdate, Column, DataType, Model, Table } from 'sequelize-typescript';
import { ChargingStation } from '../Location/index.js';
import { type ChargingStation as ChargingStationType } from '../Location/index.js';
@Table
export class ChargingStationSequence extends Model {
  static readonly MODEL_NAME: string = 'ChargingStationSequence';

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    unique: 'stationPkId_type',
  })
  declare stationPkId?: number;

  @Column({
    type: DataType.STRING(36),
    allowNull: false,
  })
  declare stationId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: 'stationPkId_type',
  })
  type!: ChargingStationSequenceTypeEnumType;

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    defaultValue: 0,
  })
  value!: number;

  declare station: ChargingStationType;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

  @BeforeCreate
  static async resolveStationPkId(instance: ChargingStationSequence): Promise<void> {
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
