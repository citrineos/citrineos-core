// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  StatusNotificationDto,
  TenantDto,
  ChargingStationDto,
  LatestStatusNotificationDto,
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

import { Tenant } from '../tenant.js';
import { ChargingStation } from './charging-station.js';
import { StatusNotification } from './status-notification.js';

@Table
export class LatestStatusNotification extends Model implements LatestStatusNotificationDto {
  static readonly MODEL_NAME: string = OCPP2_Namespace.LatestStatusNotification;

  @ForeignKey(() => ChargingStation)
  @Column(DataType.INTEGER)
  declare stationId?: number;

  @Column(DataType.STRING)
  declare ocppConnectionName: string;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation: ChargingStationDto;

  @ForeignKey(() => StatusNotification)
  declare statusNotificationId: string;

  @BelongsTo(() => StatusNotification, 'statusNotificationId')
  declare statusNotification: StatusNotificationDto;

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
  static async resolveStationId(instance: LatestStatusNotification): Promise<void> {
    if (instance.stationId == null && instance.ocppConnectionName && instance.tenantId != null) {
      const station = await ChargingStation.findOne({
        where: { ocppConnectionName: instance.ocppConnectionName, tenantId: instance.tenantId },
        attributes: ['id'],
      });
      if (station) {
        instance.stationId = station.id;
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
