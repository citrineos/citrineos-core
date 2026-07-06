// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  BootDto,
  ChargingStationDto,
  ComponentDto,
  EvseTypeDto,
  TenantDto,
  VariableAttributeDto,
  VariableDto,
  VariableStatusDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPP2_Namespace } from '@citrineos/base';
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
import { ChargingStation } from '../Location/index.js';

import { Boot } from '../Boot.js';
import { Tenant } from '../Tenant.js';
import { Component } from './Component.js';
import { EvseType } from './EvseType.js';
import { Variable } from './Variable.js';
import { VariableStatus } from './VariableStatus.js';

@Table({
  indexes: [
    {
      unique: true,
      name: 'variable_attributes_stationId',
      fields: ['stationId'],
      where: {
        type: null,
        variableId: null,
        componentId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationId_type',
      fields: ['stationId', 'type'],
      where: {
        variableId: null,
        componentId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationId_variableId',
      fields: ['stationId', 'variableId'],
      where: {
        type: null,
        componentId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationId_componentId',
      fields: ['stationId', 'componentId'],
      where: {
        type: null,
        variableId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationId_type_variableId',
      fields: ['stationId', 'type', 'variableId'],
      where: {
        componentId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationId_type_componentId',
      fields: ['stationId', 'type', 'componentId'],
      where: {
        variableId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationId_variableId_componentId',
      fields: ['stationId', 'variableId', 'componentId'],
      where: {
        type: null,
      },
    },
  ],
})
export class VariableAttribute
  extends Model
  implements OCPP2_0_1.VariableAttributeType, VariableAttributeDto
{
  static readonly MODEL_NAME: string = OCPP2_Namespace.VariableAttributeType;

  /**
   * Fields
   */

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_type_variableId_componentId',
    allowNull: true,
  })
  declare stationId?: number;

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare ocppConnectionName: string;

  @BelongsTo(() => ChargingStation, 'stationId')
  declare chargingStation: ChargingStationDto;

  @Column({
    type: DataType.STRING,
    defaultValue: OCPP2_0_1.AttributeEnumType.Actual,
    unique: 'stationId_type_variableId_componentId',
  })
  declare type?: OCPP2_0_1.AttributeEnumType | null;

  // From VariableCharacteristics, which belongs to Variable associated with this VariableAttribute
  @Column({
    type: DataType.STRING,
    defaultValue: OCPP2_0_1.DataEnumType.string,
  })
  declare dataType: OCPP2_0_1.DataEnumType;

  @Column({
    type: DataType.STRING(4000),
  })
  declare value?: string | null;

  @Column({
    type: DataType.STRING,
    defaultValue: OCPP2_0_1.MutabilityEnumType.ReadWrite,
  })
  declare mutability?: OCPP2_0_1.MutabilityEnumType | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare persistent?: boolean | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare constant?: boolean | null;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('generatedAt').toISOString();
    },
  })
  declare generatedAt: string;

  /**
   * Relations
   */

  @BelongsTo(() => Variable, 'variableId')
  declare variable: VariableDto;

  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_type_variableId_componentId',
  })
  declare variableId?: number | null;

  @BelongsTo(() => Component, 'componentId')
  declare component: ComponentDto;

  @ForeignKey(() => Component)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_type_variableId_componentId',
  })
  declare componentId?: number | null;

  @BelongsTo(() => EvseType, 'evseDatabaseId')
  declare evse?: EvseTypeDto;

  @ForeignKey(() => EvseType)
  @Column(DataType.INTEGER)
  declare evseDatabaseId?: number | null;

  // History of variable status. Can be directly from GetVariablesResponse or SetVariablesResponse, or from NotifyReport handling, or from 'setOnCharger' option for data api

  @HasMany(() => VariableStatus, 'variableAttributeId')
  declare statuses?: VariableStatusDto[];

  // Below used to associate attributes with boot process

  @BelongsTo(() => Boot, 'bootConfigId')
  declare bootConfig?: BootDto;

  @ForeignKey(() => Boot)
  @Column(DataType.STRING)
  declare bootConfigId?: string | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;

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

  @BeforeCreate
  static async resolveStationId(instance: VariableAttribute): Promise<void> {
    if (instance.stationId == null && instance.ocppConnectionName && instance.tenantId != null) {
      const station = await ChargingStation.findOne({
        where: { ocppConnectionName: instance.ocppConnectionName, tenantId: instance.tenantId },
        attributes: ['id'],
      });
      if (station) {
        instance.stationId = station.id;
      }
    }
  }

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: VariableAttribute) {
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
