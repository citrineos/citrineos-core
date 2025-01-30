// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace, OCPP2_0_1 } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Evse } from '../DeviceModel';
import { Transaction } from '../TransactionEvent';

@Table
export class ChargingNeeds extends Model implements OCPP2_0_1.ChargingNeedsType {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.ChargingNeeds;

  /**
   * Fields
   */
  @Column(DataType.JSONB)
  declare acChargingParameters?: OCPP2_0_1.ACChargingParametersType | null;

  @Column(DataType.JSONB)
  declare dcChargingParameters?: OCPP2_0_1.DCChargingParametersType | null;

  @Column({
    type: DataType.DATE,
    get() {
      const departureTime: Date = this.getDataValue('departureTime');
      return departureTime ? departureTime.toISOString() : null;
    },
  })
  declare departureTime?: string | null;

  @Column(DataType.STRING)
  declare requestedEnergyTransfer: OCPP2_0_1.EnergyTransferModeEnumType;

  @Column(DataType.INTEGER)
  declare maxScheduleTuples?: number | null;

  /**
   * Relations
   */
  @ForeignKey(() => Evse)
  @Column(DataType.INTEGER)
  declare evseDatabaseId: number;

  @BelongsTo(() => Evse)
  declare evse: OCPP2_0_1.EVSEType;

  @ForeignKey(() => Transaction)
  @Column(DataType.INTEGER)
  declare transactionDatabaseId: number;

  @BelongsTo(() => Transaction)
  declare transaction: OCPP2_0_1.TransactionType;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
