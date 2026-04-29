// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ChargingStationDto,
  ComponentDto,
  EventNotificationEnumType,
  MonitorEnumType,
  TenantDto,
  VariableDto,
  VariableMonitoringDto,
  VariableMonitoringStatusDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPP2_Namespace } from '@citrineos/base';
import {
  AutoIncrement,
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Component } from '../DeviceModel/Component.js';
import { Variable } from '../DeviceModel/Variable.js';
import { ChargingStation } from '../Location/index.js';
import { Tenant } from '../Tenant.js';
import { VariableMonitoringStatus } from './VariableMonitoringStatus.js';

@Table
export class VariableMonitoring extends Model implements VariableMonitoringDto {
  static readonly MODEL_NAME: string = OCPP2_Namespace.VariableMonitoringType;

  /**
   * Fields
   */

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @ForeignKey(() => ChargingStation)
  @Index
  @Column({
    type: DataType.STRING,
    unique: 'stationId_Id',
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_Id',
  })
  declare id: number;

  @Column(DataType.BOOLEAN)
  declare transaction: boolean;

  @Column(DataType.INTEGER)
  declare value: number;

  @Column(DataType.STRING)
  declare type: MonitorEnumType;

  @Column(DataType.INTEGER)
  declare severity: number;

  // OCPP 2.1 field
  @Column(DataType.STRING)
  declare eventNotificationType?: EventNotificationEnumType | null;

  /**
   * Relations
   */

  @BelongsTo(() => Variable, 'variableId')
  declare variable: VariableDto;

  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
  })
  declare variableId?: number | null;

  @BelongsTo(() => Component, 'componentId')
  declare component: ComponentDto;

  @ForeignKey(() => Component)
  @Column({
    type: DataType.INTEGER,
  })
  declare componentId?: number | null;

  @HasMany(() => VariableMonitoringStatus, 'variableMonitoringId')
  declare statuses?: VariableMonitoringStatusDto[];

  declare customData?: OCPP2_0_1.CustomDataType | null;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation?: ChargingStationDto;

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
  static setDefaultTenant(instance: VariableMonitoring) {
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
