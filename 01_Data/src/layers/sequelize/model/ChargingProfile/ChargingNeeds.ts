// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ACChargingParametersType, ChargingNeedsType, CustomDataType, DCChargingParametersType, EnergyTransferModeEnumType, EVSEType, Namespace, TransactionType } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Evse } from '../DeviceModel';
import { Transaction } from '../TransactionEvent';

@Table
export class ChargingNeeds extends Model implements ChargingNeedsType {
  static readonly MODEL_NAME: string = Namespace.ChargingNeeds;

  /**
   * Fields
   */
  @Column(DataType.JSONB)
  declare acChargingParameters?: ACChargingParametersType | null;

  @Column(DataType.JSONB)
  declare dcChargingParameters?: DCChargingParametersType | null;

  @Column({
    type: DataType.DATE,
    get() {
      const departureTime: Date = this.getDataValue('departureTime');
      return departureTime ? departureTime.toISOString() : null;
    },
  })
  declare departureTime?: string | null;

  @Column(DataType.STRING)
  declare requestedEnergyTransfer: EnergyTransferModeEnumType;

  @Column(DataType.INTEGER)
  declare maxScheduleTuples?: number | null;

  /**
   * Relations
   */
  @ForeignKey(() => Evse)
  @Column({
    type: DataType.INTEGER,
    unique: 'transactionDatabaseId_evseDatabaseId',
  })
  declare evseDatabaseId: number;

  @BelongsTo(() => Evse)
  declare evse: EVSEType;

  @ForeignKey(() => Transaction)
  @Column({
    type: DataType.INTEGER,
    unique: 'transactionDatabaseId_evseDatabaseId',
  })
  declare transactionDatabaseId: number;

  @BelongsTo(() => Transaction)
  declare transaction: TransactionType;

  declare customData?: CustomDataType | null;
}
