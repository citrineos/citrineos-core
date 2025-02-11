// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {Namespace} from '@citrineos/base';
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { ChargingSchedule } from './ChargingSchedule';

@Table
export class SalesTariff extends Model {
  static readonly MODEL_NAME: string = Namespace.SalesTariff;

  /**
   * Fields
   */
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.INTEGER,
    unique: 'id_chargingScheduleDatabaseId',
  })
  declare id: number;

  @Column(DataType.INTEGER)
  declare numEPriceLevels?: number | null;

  @Column(DataType.STRING)
  declare salesTariffDescription?: string | null;

  @Column(DataType.JSONB)
  declare salesTariffEntry: [object, ...object[]];

  /**
   * Relations
   */
  @ForeignKey(() => ChargingSchedule)
  @Column({
    type: DataType.INTEGER,
    unique: 'id_chargingScheduleDatabaseId',
  })
  declare chargingScheduleDatabaseId: number;

  @BelongsTo(() => ChargingSchedule)
  declare chargingSchedule: ChargingSchedule;

  declare customData?: object | null;
}
