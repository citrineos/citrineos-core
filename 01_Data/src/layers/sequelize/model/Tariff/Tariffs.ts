// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { Column, DataType, Index, Model, Table } from 'sequelize-typescript';
import { TariffUnitEnumType } from './index';

@Table
export class Tariff extends Model {
  static readonly MODEL_NAME: string = Namespace.Tariff;

  /**
   * Fields
   */

  @Index
  @Column({
    type: DataType.STRING,
    unique: 'stationId_unit',
  })
  declare stationId: string;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_unit',
  })
  declare unit: TariffUnitEnumType;

  @Column(DataType.DECIMAL)
  declare price: number;
}
