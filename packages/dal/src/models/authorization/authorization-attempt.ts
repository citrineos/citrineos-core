// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type {
  AuthorizationAttemptDto,
  AuthorizationAttemptReason,
  AuthorizationDto,
  AuthorizationStatusEnumType,
  ChargingStationDto,
  TenantDto,
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
import { ChargingStation } from '../location/index.js';
import { Tenant } from '../tenant.js';
import { Authorization } from './authorization.js';

/**
 * Append-only. Range partitioned weekly on "createdAt" by its migration, so the primary key in the
 * database is the composite (id, "createdAt"); see `rotate_authorization_attempts_partitions`.
 */
@Table({
  indexes: [
    {
      name: 'authorization_attempts_authorization_id_timestamp',
      fields: ['authorizationId', 'timestamp'],
    },
    { name: 'authorization_attempts_station_id_timestamp', fields: ['stationId', 'timestamp'] },
  ],
})
export class AuthorizationAttempt extends Model implements AuthorizationAttemptDto {
  static readonly MODEL_NAME: string = 'AuthorizationAttempt';

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
  declare ocppVersion: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare action: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare correlationId: string;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp')?.toISOString();
    },
    allowNull: false,
  })
  declare timestamp: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare idToken: string;

  @Column(DataType.STRING)
  declare idTokenType?: string | null;

  @ForeignKey(() => Authorization)
  @Column({
    type: DataType.INTEGER,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  declare authorizationId?: number | null;

  @BelongsTo(() => Authorization, 'authorizationId')
  declare authorization?: AuthorizationDto;

  @Column(DataType.STRING)
  declare storedStatus?: AuthorizationStatusEnumType | null;

  @Column(DataType.STRING)
  declare responseStatus?: string | null;

  @Column({ type: DataType.STRING, allowNull: false })
  declare reason: AuthorizationAttemptReason;

  @Column(DataType.JSONB)
  declare details?: Record<string, unknown> | null;

  @Column(DataType.INTEGER)
  declare evseId?: number | null;

  @Column(DataType.INTEGER)
  declare connectorId?: number | null;

  @Column(DataType.INTEGER)
  declare transactionDatabaseId?: number | null;

  @Column(DataType.DATE)
  declare transactionCreatedAt?: Date | null;

  @Column(DataType.STRING)
  declare transactionId?: string | null;

  @Column(DataType.INTEGER)
  declare remoteStartId?: number | null;

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
  static setDefaultTenant(instance: AuthorizationAttempt) {
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
