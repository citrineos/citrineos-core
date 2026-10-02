// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type {
  NetworkAlertDto,
  NetworkAlertOccurrenceDto,
  NetworkAlertSeverity,
  NetworkAlertType,
  StatusNotificationDto,
  TenantDto,
} from '@citrineos/types';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  Table,
} from 'sequelize-typescript';
import { StatusNotification } from '../location/index.js';
import { Tenant } from '../tenant.js';
import { NetworkAlert } from './network-alert.js';

@Table({
  indexes: [
    {
      name: 'network_alert_occurrences_alert_id_occurred_at',
      fields: ['alertId', 'occurredAt'],
    },
  ],
})
export class NetworkAlertOccurrence
  extends Model
  implements Omit<NetworkAlertOccurrenceDto, 'type' | 'details'>
{
  static readonly MODEL_NAME: string = 'NetworkAlertOccurrence';

  @ForeignKey(() => NetworkAlert)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  declare alertId: number;

  @BelongsTo(() => NetworkAlert, 'alertId')
  declare alert?: NetworkAlertDto;

  @Column({ type: DataType.STRING, allowNull: false })
  declare type: NetworkAlertType;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('occurredAt').toISOString();
    },
    allowNull: false,
  })
  declare occurredAt: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare severity: NetworkAlertSeverity;

  // No foreign key: the WebsocketEvents table does not exist yet.
  @Column(DataType.INTEGER)
  declare websocketEventId?: number | null;

  @ForeignKey(() => StatusNotification)
  @Index('network_alert_occurrences_status_notification_id')
  @Column({
    type: DataType.INTEGER,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  declare statusNotificationId?: number | null;

  @BelongsTo(() => StatusNotification, 'statusNotificationId')
  declare statusNotification?: StatusNotificationDto;

  // No foreign key: OCPPMessages is partitioned on (id, createdAt) and old partitions are
  // dropped, so a referenced message can disappear by retention.
  @Column(DataType.INTEGER)
  declare ocppMessageId?: number | null;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare details: NetworkAlertOccurrenceDto['details'];

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
  static setDefaultTenant(instance: NetworkAlertOccurrence) {
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
