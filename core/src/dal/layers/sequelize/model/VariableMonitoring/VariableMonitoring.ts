// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  ComponentDto,
  VariableDto,
  VariableMonitoringDto,
  TenantDto,
  MonitorEnumType,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import {
  AutoIncrement,
  BeforeCreate,
  BeforeUpdate,
  Column,
  DataType,
  Index,
  Model,
  PrimaryKey,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { ChargingStation } from '../Location/index.js';

@Table
export class VariableMonitoring extends Model implements VariableMonitoringDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.VariableMonitoringType;

  /**
   * Fields
   */

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @ForeignKey(() => ChargingStation)
  @Column(DataType.INTEGER)
  declare stationPkId?: number;

  @Index
  @Column({
    type: DataType.STRING,
    unique: 'stationId_tenantId_Id',
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_tenantId_Id',
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

  /**
   * Relations
   */

  declare variable: VariableDto;

  @Column({
    type: DataType.INTEGER,
  })
  declare variableId?: number | null;

  declare component: ComponentDto;

  @Column({
    type: DataType.INTEGER,
  })
  declare componentId?: number | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    unique: 'stationId_tenantId_Id',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

  @BeforeCreate
  static async resolveStationPkId(instance: VariableMonitoring): Promise<void> {
    if (instance.stationPkId == null && instance.stationId && instance.tenantId != null) {
      // Lazy load ChargingStation to avoid circular dependency
      const { ChargingStation } = await import('../Location/index.js');
      const station = await ChargingStation.findOne({
        where: { id: instance.stationId, tenantId: instance.tenantId },
        attributes: ['pkId'],
      });
      if (station) {
        instance.stationPkId = station.pkId;
      }
    }
  }

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
