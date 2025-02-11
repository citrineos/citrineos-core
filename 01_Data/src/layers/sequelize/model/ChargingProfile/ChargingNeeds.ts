// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {OCPP2_0_1_Namespace, OCPP2_0_1, Namespace} from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Evse } from '../DeviceModel';
import { Transaction } from '../TransactionEvent';

@Table
export class ChargingNeeds extends Model {
  static readonly MODEL_NAME: string = Namespace.ChargingNeeds;

  /**
   * Fields
   */
  @Column(DataType.JSONB)
  declare acChargingParameters?: object | null;

  @Column(DataType.JSONB)
  declare dcChargingParameters?: object | null;

  @Column({
    type: DataType.DATE,
    get() {
      const departureTime: Date = this.getDataValue('departureTime');
      return departureTime ? departureTime.toISOString() : null;
    },
  })
  declare departureTime?: string | null;

  @Column(DataType.STRING)
  declare requestedEnergyTransfer: string;

  @Column(DataType.INTEGER)
  declare maxScheduleTuples?: number | null;

  /**
   * Relations
   */
  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseDatabaseId: number;

  @BelongsTo(() => Evse)
  declare evse: Evse;

  @ForeignKey(() => Transaction)
  @Column(DataType.INTEGER)
  declare transactionDatabaseId: number;

  @BelongsTo(() => Transaction)
  declare transaction: Transaction;

  declare customData?: object | null;
}
