// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ChargingStationDto,
  ConnectorStatusEnumType,
  ConnectorDto,
  StatusNotificationDto,
  TenantDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
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
import { ChargingStation } from './ChargingStation.js';
import { Connector } from './Connector.js';
import { Tenant } from '../Tenant.js';

@Table
export class StatusNotification extends Model implements StatusNotificationDto {
  static readonly MODEL_NAME: string = Namespace.StatusNotificationRequest;

  @ForeignKey(() => ChargingStation)
  @Column(DataType.STRING)
  declare stationId: string;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation: ChargingStationDto;

  @Column({
    type: DataType.DATE,
    get() {
      const timestamp = this.getDataValue('timestamp');
      return timestamp ? timestamp.toISOString() : null;
    },
  })
  declare timestamp?: string | null;

  @Column(DataType.STRING)
  declare connectorStatus: ConnectorStatusEnumType;

  @Column(DataType.INTEGER)
  declare evseId?: number | null;

  @Column(DataType.INTEGER)
  declare connectorId: number;

  @Column(DataType.STRING)
  declare errorCode?: string | null;

  @Column(DataType.STRING)
  declare info?: string | null;

  @Column(DataType.STRING)
  declare vendorId?: string | null;

  @Column(DataType.STRING)
  declare vendorErrorCode?: string | null;

  declare customData?: object | null;

  @BelongsTo(() => Connector, 'connectorId')
  declare connector?: ConnectorDto;

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
  static setDefaultTenant(instance: StatusNotification) {
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
