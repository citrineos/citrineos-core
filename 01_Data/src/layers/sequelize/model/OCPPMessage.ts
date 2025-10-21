// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction, OCPPMessageDto, TenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID, MessageOrigin, Namespace, OCPPVersion } from '@citrineos/base';
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
import { ChargingStation, Tenant } from '../index.js';

@Table
export class OCPPMessage extends Model implements OCPPMessageDto {
  static readonly MODEL_NAME: string = Namespace.OCPPMessage;

  @ForeignKey(() => ChargingStation)
  @Index
  @Column(DataType.STRING)
  declare stationId: string;

  @Index
  @Column(DataType.STRING)
  declare correlationId?: string;

  @Column(DataType.STRING)
  declare origin: MessageOrigin;

  @Column(DataType.STRING)
  declare protocol: OCPPVersion;

  @Column(DataType.STRING)
  declare action?: CallAction;

  @Column(DataType.JSONB)
  declare message: any;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp')?.toISOString();
    },
  })
  declare timestamp: string;

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
  static setDefaultTenant(instance: OCPPMessage) {
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
