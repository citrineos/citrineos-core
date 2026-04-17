// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { VariableAttributeTableDto } from '@citrineos/base';
import { OCPP2_0_1, OCPP2_Namespace } from '@citrineos/base';
import { Column, DataType, Index, Model, Table } from 'sequelize-typescript';
import { CryptoUtils } from '../../../../util/CryptoUtils.js';

@Table({
  tableName: 'VariableAttributes',
  indexes: [
    {
      unique: true,
      name: 'variable_attributes_stationPkId',
      fields: ['stationPkId'],
      where: {
        type: null,
        variableId: null,
        componentId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_type',
      fields: ['stationPkId', 'type'],
      where: {
        variableId: null,
        componentId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_variableId',
      fields: ['stationPkId', 'variableId'],
      where: {
        type: null,
        componentId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_componentId',
      fields: ['stationPkId', 'componentId'],
      where: {
        type: null,
        variableId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_type_variableId',
      fields: ['stationPkId', 'type', 'variableId'],
      where: {
        componentId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_type_componentId',
      fields: ['stationPkId', 'type', 'componentId'],
      where: {
        variableId: null,
      },
    },
    {
      unique: true,
      name: 'variable_attributes_stationPkId_variableId_componentId',
      fields: ['stationPkId', 'variableId', 'componentId'],
      where: {
        type: null,
      },
    },
  ],
})
export class VariableAttributeTable
  extends Model
  implements OCPP2_0_1.VariableAttributeType, VariableAttributeTableDto
{
  static readonly MODEL_NAME: string = OCPP2_Namespace.VariableAttributeType;

  /**
   * Fields
   */

  @Index
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare stationId: string;

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
        const valueType = (this as VariableAttributeTable).dataType;
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

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
