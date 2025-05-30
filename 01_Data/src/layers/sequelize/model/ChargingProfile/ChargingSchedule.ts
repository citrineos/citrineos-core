// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasOne,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { ChargingProfile } from './ChargingProfile';
import { SalesTariff } from './SalesTariff';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class ChargingSchedule extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = Namespace.ChargingSchedule;

  /**
   * Fields
   */
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_id',
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_id',
  })
  declare stationId: string;

  @Column(DataType.STRING)
  declare chargingRateUnit: string;

  @Column(DataType.JSONB)
  declare chargingSchedulePeriod: [any, ...any[]];

  @Column(DataType.INTEGER)
  declare duration?: number | null;

  @Column(DataType.DECIMAL)
  declare minChargingRate?: number | null;

  @Column(DataType.STRING)
  declare startSchedule?: string | null;

  // Periods contained in the charging profile are relative to this point in time.
  // From NotifyEVChargingScheduleRequest
  @Column({
    type: DataType.DATE,
    get() {
      const timeBase: Date = this.getDataValue('timeBase');
      return timeBase ? timeBase.toISOString() : null;
    },
  })
  declare timeBase?: string;

  /**
   * Relations
   */
  @BelongsTo(() => ChargingProfile)
  declare chargingProfile: ChargingProfile;

  @ForeignKey(() => ChargingProfile)
  @Column(DataType.INTEGER)
  declare chargingProfileDatabaseId?: number;

  @HasOne(() => SalesTariff)
  declare salesTariff?: SalesTariff;

  declare customData?: object | null;
}
