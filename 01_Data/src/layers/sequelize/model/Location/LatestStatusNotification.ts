// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, OCPP2_0_1_Namespace } from '@citrineos/base';
import type { TenantDto } from '@citrineos/base';
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
import { Tenant } from '../Tenant.js';
import { ChargingStation } from './ChargingStation.js';
import { StatusNotification } from './StatusNotification.js';

@Table
export class LatestStatusNotification extends Model {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.LatestStatusNotification;

  @ForeignKey(() => ChargingStation)
  declare stationId: string;

  @BelongsTo(() => ChargingStation)
  declare chargingStation: ChargingStation;

  @ForeignKey(() => StatusNotification)
  declare statusNotificationId: string;

  @BelongsTo(() => StatusNotification)
  declare statusNotification: StatusNotification;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: TenantDto;

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
