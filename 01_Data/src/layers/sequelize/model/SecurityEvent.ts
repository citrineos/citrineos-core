// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import type { TenantDto } from '@citrineos/base';
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
import { Tenant } from './Tenant.js';

@Table
export class SecurityEvent extends Model implements OCPP2_0_1.SecurityEventNotificationRequest {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.SecurityEventNotificationRequest;

  /**
   * Fields
   */
  @Index
  @Column(DataType.STRING)
  declare stationId: string;

  @Column(DataType.STRING)
  declare type: string;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('timestamp').toISOString();
    },
  })
  declare timestamp: string;

  @Column(DataType.STRING)
  declare techInfo?: string | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;

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
  static setDefaultTenant(instance: SecurityEvent) {
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
