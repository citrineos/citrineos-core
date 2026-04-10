// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  DEFAULT_TENANT_ID,
  type LatestStatusNotificationDto,
  OCPP2_0_1_Namespace,
} from '@citrineos/base';
import type { TenantDto } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import { ChargingStation } from './ChargingStation.js';
import { StatusNotification } from './StatusNotification.js';

@Table
export class LatestStatusNotification extends Model implements LatestStatusNotificationDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.LatestStatusNotification;

  @ForeignKey(() => ChargingStation)
  @Column(DataType.INTEGER)
  declare stationPkId?: number;

  @Column(DataType.STRING)
  declare stationId: string;

  declare chargingStation: ChargingStation;

  declare statusNotificationId: string;

  declare statusNotification: StatusNotification;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

  @BeforeCreate
  static async resolveStationPkId(instance: LatestStatusNotification): Promise<void> {
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
  static setDefaultTenant(instance: LatestStatusNotification) {
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
