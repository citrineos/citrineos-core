// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AttributeEnumType, ComponentType, type CustomDataType, DataEnumType, EVSEType, MutabilityEnumType, Namespace, type VariableAttributeType, VariableType } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Index, Model, Table } from 'sequelize-typescript';
import { Variable } from './Variable';
import { Component } from './Component';
import { Evse } from './Evse';
import { Boot } from '../Boot';
import { VariableStatus } from './VariableStatus';
import { ChargingStation } from '../Location';
import { CryptoUtils } from '../../../../util/CryptoUtils';

@Table
export class VariableAttribute extends Model implements VariableAttributeType {
  static readonly MODEL_NAME: string = Namespace.VariableAttributeType;

  /**
   * Fields
   */

  @Index
  @Column({
    unique: 'stationId_type_variableId_componentId',
  })
  @ForeignKey(() => ChargingStation)
  declare stationId: string;

  @BelongsTo(() => ChargingStation)
  declare chargingStation: ChargingStation;

  @Column({
    type: DataType.STRING,
    defaultValue: AttributeEnumType.Actual,
    unique: 'stationId_type_variableId_componentId',
  })
  declare type?: AttributeEnumType | null;

  // From VariableCharacteristics, which belongs to Variable associated with this VariableAttribute
  @Column({
    type: DataType.STRING,
    defaultValue: DataEnumType.string,
  })
  declare dataType: DataEnumType;

  @Column({
    // TODO: Make this configurable? also used in VariableStatus model
    type: DataType.STRING(4000),
    set(valueString: string) {
      if (valueString) {
        const valueType = (this as VariableAttribute).dataType;
        switch (valueType) {
          case DataEnumType.passwordString:
            valueString = CryptoUtils.getSaltedHash(valueString);
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
    defaultValue: MutabilityEnumType.ReadWrite,
  })
  declare mutability?: MutabilityEnumType | null;

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
  declare variable: VariableType;

  @ForeignKey(() => Variable)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_type_variableId_componentId',
  })
  declare variableId?: number | null;

  @BelongsTo(() => Component)
  declare component: ComponentType;

  @ForeignKey(() => Component)
  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_type_variableId_componentId',
  })
  declare componentId?: number | null;

  @BelongsTo(() => Evse)
  declare evse?: EVSEType;

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

  declare customData?: CustomDataType | null;
}
