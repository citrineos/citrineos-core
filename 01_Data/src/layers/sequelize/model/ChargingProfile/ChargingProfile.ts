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
  HasMany,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Transaction } from '../TransactionEvent';
import { ChargingSchedule } from './ChargingSchedule';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class ChargingProfile extends BaseModelWithTenant {
  static readonly MODEL_NAME: string = Namespace.ChargingProfile;

  /**
   * Fields
   */
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare databaseId: number;

  @Column({
    type: DataType.STRING,
    unique: 'stationId_id',
  })
  declare stationId: string;

  @Column({
    type: DataType.INTEGER,
    unique: 'stationId_id',
  })
  declare id: number;

  @Column(DataType.STRING)
  declare chargingProfileKind: string;

  @Column(DataType.STRING)
  declare chargingProfilePurpose: string;

  @Column(DataType.STRING)
  declare recurrencyKind?: string | null;

  @Column(DataType.INTEGER)
  declare stackLevel: number;

  @Column({
    type: DataType.DATE,
    get() {
      const validFrom: Date = this.getDataValue('validFrom');
      return validFrom ? validFrom.toISOString() : null;
    },
  })
  declare validFrom?: string | null;

  @Column({
    type: DataType.DATE,
    get() {
      const validTo: Date = this.getDataValue('validTo');
      return validTo ? validTo.toISOString() : null;
    },
  })
  declare validTo?: string | null;

  @Column(DataType.INTEGER)
  declare evseId?: number | null;

  // this value indicates whether the ChargingProfile is set on charger
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: 'CSO',
  })
  declare chargingLimitSource?: string | null;

  /**
   * Relations
   */
  @HasMany(() => ChargingSchedule)
  declare chargingSchedule:
    | [ChargingSchedule]
    | [ChargingSchedule, ChargingSchedule]
    | [ChargingSchedule, ChargingSchedule, ChargingSchedule];

  @ForeignKey(() => Transaction)
  declare transactionDatabaseId?: number | null;

  @BelongsTo(() => Transaction)
  declare transaction?: Transaction;

  declare customData?: object | null;
}
