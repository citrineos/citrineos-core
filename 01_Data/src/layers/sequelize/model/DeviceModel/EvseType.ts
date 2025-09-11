// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IEvseTypeDto, OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import { AutoIncrement, Column, DataType, PrimaryKey, Table } from 'sequelize-typescript';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table({
  indexes: [
    {
      unique: true,
      fields: ['id'],
      where: {
        connectorId: null,
      },
    },
  ],
})
export class EvseType extends BaseModelWithTenant implements OCPP2_0_1.EVSEType, IEvseTypeDto {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.EVSEType;

  /**
   * Fields
   */

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.INTEGER,
    unique: 'id_connectorId',
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER,
    unique: 'id_connectorId',
  })
  declare connectorId?: number | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
