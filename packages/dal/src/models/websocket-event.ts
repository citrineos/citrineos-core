// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type {
  ChargingStationDto,
  MessageOrigin,
  TenantDto,
  WebsocketEventDto,
  WebsocketEventType,
} from '@citrineos/types';
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
import { ChargingStation } from './location/index.js';
import { Tenant } from './tenant.js';

/**
 * Range partitioned weekly on "createdAt" by its migration, so the primary key in the database is
 * the composite (id, "createdAt"); see `rotate_websocket_events_partitions`.
 */
@Table({
  indexes: [
    { name: 'websocket_events_station_id_timestamp', fields: ['stationId', 'timestamp'] },
    { name: 'websocket_events_type_timestamp', fields: ['type', 'timestamp'] },
  ],
})
export class WebsocketEvent extends Model implements WebsocketEventDto {
  static readonly MODEL_NAME: string = 'WebsocketEvent';

  // Null when the event names no station this tenant knows, e.g. a rejected upgrade.
  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.INTEGER,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  declare stationId?: number | null;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation?: ChargingStationDto;

  @Column({ type: DataType.STRING, allowNull: false })
  declare serverId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare host: string;

  // TEXT: taken from X-Forwarded-For, which the client controls.
  @Column(DataType.TEXT)
  declare remoteAddress?: string | null;

  @Column(DataType.TEXT)
  declare uri?: string | null;

  @Column({ type: DataType.STRING, allowNull: false })
  declare type: WebsocketEventType;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp')?.toISOString();
    },
    allowNull: false,
  })
  declare timestamp: string;

  @Column(DataType.STRING)
  declare subprotocol?: string | null;

  @Column(DataType.INTEGER)
  declare httpStatus?: number | null;

  @Column(DataType.INTEGER)
  declare wsCloseCode?: number | null;

  @Column(DataType.INTEGER)
  declare sentCode?: number | null;

  // TEXT: some of our own close reasons embed the station identifier from the URL.
  @Column(DataType.TEXT)
  declare closeReason?: string | null;

  @Column(DataType.STRING)
  declare initiator?: MessageOrigin | null;

  @Column(DataType.STRING)
  declare source?: string | null;

  @Column(DataType.JSONB)
  declare details?: Record<string, unknown> | null;

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
  static setDefaultTenant(instance: WebsocketEvent) {
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
