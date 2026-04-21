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
  Table,
} from 'sequelize-typescript';

import { ChargingStation } from '../Location/ChargingStation.js';

import { Boot } from '../Boot.js';
import { Tenant } from '../Tenant.js';
import { Component } from './Component.js';
import { EvseType } from './EvseType.js';
import { Variable } from './Variable.js';
import { VariableStatus } from './VariableStatus.js';
import { VariableAttributeTable } from '@dal/layers/sequelize/model/DeviceModel/VariableAttributeTable.js';

@Table({
  tableName: 'VariableAttributes',
  indexes: [
    {
      unique: true,
      name: 'variable_attributes_stationPkId',
      fields: ['stationPkId'],
      where: { type: null, variableId: null, componentId: null },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_type',
      fields: ['stationPkId', 'type'],
      where: { variableId: null, componentId: null },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_variableId',
      fields: ['stationPkId', 'variableId'],
      where: { type: null, componentId: null },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_componentId',
      fields: ['stationPkId', 'componentId'],
      where: { type: null, variableId: null },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_type_variableId',
      fields: ['stationPkId', 'type', 'variableId'],
      where: { componentId: null },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_type_componentId',
      fields: ['stationPkId', 'type', 'componentId'],
      where: { variableId: null },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_variableId_componentId',
      fields: ['stationPkId', 'variableId', 'componentId'],
      where: { type: null },
    },
  ],
})
export class VariableAttribute
  extends VariableAttributeTable
  implements OCPP2_0_1.VariableAttributeType, VariableAttributeDto
{
  static readonly MODEL_NAME: string = OCPP2_Namespace.VariableAttributeType;

  /**
   * Fields
   */

  @ForeignKey(() => ChargingStation)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationPkId_type_variableId_componentId',
    allowNull: true,
  })
  declare stationPkId?: number;

  @BelongsTo(() => ChargingStation, 'stationPkId')
  declare chargingStation: ChargingStationDto;

  /**
   * Relations
   */

  @BelongsTo(() => Variable, 'variableId')
  declare variable: VariableDto;

  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationPkId_type_variableId_componentId',
  })
  declare variableId?: number | null;

  @BelongsTo(() => Component, 'componentId')
  declare component: ComponentDto;

  @ForeignKey(() => Component)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationPkId_type_variableId_componentId',
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
  static async resolveStationPkId(instance: VariableAttribute): Promise<void> {
    if (instance.stationPkId == null && instance.stationId && instance.tenantId != null) {
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
