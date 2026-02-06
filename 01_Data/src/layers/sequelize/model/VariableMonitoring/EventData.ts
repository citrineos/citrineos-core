// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ComponentDto, EventDataDto, VariableDto, TenantDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
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
import { Component, Variable } from '../DeviceModel/index.js';
import { Tenant } from '../Tenant.js';

@Table
export class EventData extends Model implements OCPP2_0_1.EventDataType, EventDataDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.EventDataType;

  /**
   * Fields
   */
  @Index
  @Column({
    type: DataType.STRING,
    unique: 'stationId_eventId',
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_eventId',
  })
  declare eventId: number;

  @Column(DataType.STRING)
  declare trigger: OCPP2_0_1.EventTriggerEnumType;

  @Column(DataType.INTEGER)
  declare cause?: number | null;

  @Column({
    type: DataType.DATE,
    get() {
      const timestamp: Date = this.getDataValue('timestamp');
      return timestamp ? timestamp.toISOString() : null;
    },
  })
  declare timestamp: string;

  @Column(DataType.STRING)
  declare actualValue: string;

  @Column(DataType.STRING)
  declare techCode?: string | null;

  @Column(DataType.STRING)
  declare techInfo?: string | null;

  @Column(DataType.BOOLEAN)
  declare cleared?: boolean | null;

  @Column(DataType.STRING)
  declare transactionId?: string | null;

  @Column(DataType.INTEGER)
  declare variableMonitoringId?: number | null;

  @Column(DataType.STRING)
  declare eventNotificationType: OCPP2_0_1.EventNotificationEnumType;

  /**
   * Relations
   */
  @BelongsTo(() => Variable)
  declare variable: VariableDto;

  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
  })
  declare variableId?: number;

  @BelongsTo(() => Component)
  declare component: ComponentDto;

  @ForeignKey(() => Component)
  @Column({
    type: DataType.INTEGER,
  })
  declare componentId?: number;

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
  static setDefaultTenant(instance: EventData) {
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
