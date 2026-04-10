// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  BootDto,
  ComponentDto,
  VariableAttributeDto,
  VariableDto,
  TenantDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  Column,
  DataType,
  ForeignKey,
  Index,
  Model,
  Table,
} from 'sequelize-typescript';
import { CryptoUtils } from '../../../../util/CryptoUtils.js';

import { ChargingStation } from '../Location/index.js';

import { EvseType } from './EvseType.js';

import { VariableStatus } from './VariableStatus.js';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['stationPkId'],
      where: {
        type: null,
        variableId: null,
        componentId: null,
      },
    },
    {
      unique: true,
      fields: ['stationPkId', 'type'],
      where: {
        variableId: null,
        componentId: null,
      },
    },
    {
      unique: true,
      fields: ['stationPkId', 'variableId'],
      where: {
        type: null,
        componentId: null,
      },
    },
    {
      unique: true,
      fields: ['stationPkId', 'componentId'],
      where: {
        type: null,
        variableId: null,
      },
    },
    {
      unique: true,
      fields: ['stationPkId', 'type', 'variableId'],
      where: {
        componentId: null,
      },
    },
    {
      unique: true,
      fields: ['stationPkId', 'type', 'componentId'],
      where: {
        variableId: null,
      },
    },
    {
      unique: true,
      fields: ['stationPkId', 'variableId', 'componentId'],
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
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.VariableAttributeType;

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

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare stationId: string;

  declare chargingStation: ChargingStation;

  @Column({
    type: DataType.STRING,
    defaultValue: OCPP2_0_1.AttributeEnumType.Actual,
    unique: 'stationPkId_type_variableId_componentId',
  })
  declare type?: OCPP2_0_1.AttributeEnumType | null;

  // From VariableCharacteristics, which belongs to Variable associated with this VariableAttribute
  @Column({
    type: DataType.STRING,
    defaultValue: OCPP2_0_1.DataEnumType.string,
  })
  declare dataType: OCPP2_0_1.DataEnumType;

  @Column({
    // TODO: Make this configurable? also used in VariableStatus model
    type: DataType.STRING(4000),
    set(valueString: string) {
      if (valueString) {
        const valueType = (this as VariableAttribute).dataType;
        switch (valueType) {
          case OCPP2_0_1.DataEnumType.passwordString:
            valueString = CryptoUtils.getPasswordHash(valueString);
            break;
          default:
            // Do nothing
            break;
        }
      }
      this.setDataValue('value', valueString);
    },
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

  declare variable: VariableDto;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationPkId_type_variableId_componentId',
  })
  declare variableId?: number | null;

  declare component: ComponentDto;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationPkId_type_variableId_componentId',
  })
  declare componentId?: number | null;

  declare evse?: EvseType;

  @Column(DataType.INTEGER)
  declare evseDatabaseId?: number | null;

  // History of variable status. Can be directly from GetVariablesResponse or SetVariablesResponse, or from NotifyReport handling, or from 'setOnCharger' option for data api

  declare statuses?: VariableStatus[];

  // Below used to associate attributes with boot process

  declare bootConfig?: BootDto;

  declare bootConfigId?: string | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

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
