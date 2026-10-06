// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type {
  ChargingStationDto,
  ConnectorDto,
  EvseDto,
  NetworkAlertDto,
  NetworkAlertOccurrenceDto,
  NetworkAlertResolvedBy,
  NetworkAlertSeverity,
  NetworkAlertStatus,
  NetworkAlertType,
  TenantDto,
} from '@citrineos/types';
import { Op } from 'sequelize';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Index,
  Model,
  Table,
} from 'sequelize-typescript';
import { ChargingStation, Connector, Evse } from '../location/index.js';
import { Tenant } from '../tenant.js';
import { NetworkAlertOccurrence } from './network-alert-occurrence.js';

@Table({
  indexes: [
    {
      name: 'network_alerts_open_lookup',
      fields: ['tenantId', 'stationId', 'type'],
      where: { status: { [Op.ne]: 'Resolved' } },
    },
  ],
})
export class NetworkAlert extends Model implements Omit<NetworkAlertDto, 'type' | 'details'> {
  static readonly MODEL_NAME: string = 'NetworkAlert';

  @Column({ type: DataType.STRING, allowNull: false })
  declare type: NetworkAlertType;

  @Column({ type: DataType.STRING, allowNull: false })
  declare severity: NetworkAlertSeverity;

  @Column({ type: DataType.STRING, allowNull: false })
  declare status: NetworkAlertStatus;

  @ForeignKey(() => ChargingStation)
  @Index('network_alerts_station_id')
  @Column({
    type: DataType.INTEGER,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  declare stationId?: number | null;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation?: ChargingStationDto;

  @ForeignKey(() => Evse)
  @Column({
    type: DataType.INTEGER,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  declare evseId?: number | null;

  @BelongsTo(() => Evse, 'evseId')
  declare evse?: EvseDto;

  @ForeignKey(() => Connector)
  @Column({
    type: DataType.INTEGER,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  declare connectorId?: number | null;

  @BelongsTo(() => Connector, 'connectorId')
  declare connector?: ConnectorDto;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('firstSeenAt').toISOString();
    },
    allowNull: false,
  })
  declare firstSeenAt: string;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('lastSeenAt').toISOString();
    },
    allowNull: false,
  })
  declare lastSeenAt: string;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare occurrenceCount: number;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('resolvedAt')?.toISOString();
    },
  })
  declare resolvedAt?: string | null;

  @Column(DataType.STRING)
  declare resolvedBy?: NetworkAlertResolvedBy | null;

  @Column(DataType.TEXT)
  declare statusNote?: string | null;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare details: NetworkAlertDto['details'];

  @HasMany(() => NetworkAlertOccurrence, 'alertId')
  declare occurrences?: NetworkAlertOccurrenceDto[];

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
  static setDefaultTenant(instance: NetworkAlert) {
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
