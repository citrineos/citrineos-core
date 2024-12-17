// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace, OCPP2_0_1 } from '@citrineos/base';
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { ChargingSchedule } from './ChargingSchedule';

@Table
export class SalesTariff extends Model implements OCPP2_0_1.SalesTariffType {
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
  declare salesTariffEntry: [OCPP2_0_1.SalesTariffEntryType, ...OCPP2_0_1.SalesTariffEntryType[]];

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
  declare chargingSchedule: OCPP2_0_1.ChargingScheduleType;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
