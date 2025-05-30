// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Index,
  Table,
} from 'sequelize-typescript';
import { Variable } from './Variable';
import { Component } from './Component';
import { Evse } from './Evse';
import { Boot } from '../Boot';
import { VariableStatus } from './VariableStatus';
import { ChargingStation } from '../Location';
import { CryptoUtils } from '../../../../util/CryptoUtils';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['stationId'],
      where: {
        type: null,
        variableId: null,
        componentId: null,
      },
    },
    {
      unique: true,
      fields: ['stationId', 'type'],
      where: {
        variableId: null,
        componentId: null,
      },
    },
    {
      unique: true,
      fields: ['stationId', 'variableId'],
      where: {
        type: null,
        componentId: null,
      },
    },
    {
      unique: true,
      fields: ['stationId', 'componentId'],
      where: {
        type: null,
        variableId: null,
      },
    },
    {
      unique: true,
      fields: ['stationId', 'type', 'variableId'],
      where: {
        componentId: null,
      },
    },
    {
      unique: true,
      fields: ['stationId', 'type', 'componentId'],
      where: {
        variableId: null,
      },
    },
    {
      unique: true,
      fields: ['stationId', 'variableId', 'componentId'],
      where: {
        type: null,
      },
    },
  ],
})
export class VariableAttribute
  extends BaseModelWithTenant
  implements OCPP2_0_1.VariableAttributeType
{
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.VariableAttributeType;

  /**
   * Fields
   */

  @Index
  @Column({
    unique: 'stationId_type_variableId_componentId',
    allowNull: false,
  })
  @ForeignKey(() => ChargingStation)
  declare stationId: string;

  @BelongsTo(() => ChargingStation)
  declare chargingStation: ChargingStation;

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

  @BelongsTo(() => Variable)
  declare variable: OCPP2_0_1.VariableType;

  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_type_variableId_componentId',
  })
  declare variableId?: number | null;

  @BelongsTo(() => Component)
  declare component: OCPP2_0_1.ComponentType;

  @ForeignKey(() => Component)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_type_variableId_componentId',
  })
  declare componentId?: number | null;

  @BelongsTo(() => Evse)
  declare evse?: OCPP2_0_1.EVSEType;

  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseDatabaseId?: number | null;

  // History of variable status. Can be directly from GetVariablesResponse or SetVariablesResponse, or from NotifyReport handling, or from 'setOnCharger' option for data api

  @HasMany(() => VariableStatus)
  declare statuses?: VariableStatus[];

  // Below used to associate attributes with boot process

  @BelongsTo(() => Boot)
  declare bootConfig?: Boot;

  @ForeignKey(() => Boot)
  declare bootConfigId?: string | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
