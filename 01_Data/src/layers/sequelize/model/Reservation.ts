// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1_Namespace, OCPP2_0_1 } from '@citrineos/base';
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Evse } from './DeviceModel';

@Table
export class Reservation extends Model implements OCPP2_0_1.ReserveNowRequest {
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.ReserveNowRequest;

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

  @Column({
    type: DataType.DATE,
    get() {
      const expiryDateTime: Date = this.getDataValue('expiryDateTime');
      return expiryDateTime ? expiryDateTime.toISOString() : null;
    },
  })
  declare expiryDateTime: string;

  @Column(DataType.STRING)
  declare connectorType?: OCPP2_0_1.ConnectorEnumType | null;

  @Column(DataType.STRING)
  declare reserveStatus?: OCPP2_0_1.ReserveNowStatusEnumType | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isActive: boolean;

  @Column(DataType.STRING)
  declare terminatedByTransaction?: string | null;

  @Column(DataType.JSONB)
  declare idToken: OCPP2_0_1.IdTokenType;

  @Column(DataType.JSONB)
  declare groupIdToken?: OCPP2_0_1.IdTokenType | null;

  /**
   * Relations
   */
  @ForeignKey(() => Evse)
  declare evseId?: number | null;

  @BelongsTo(() => Evse)
  declare evse?: OCPP2_0_1.EVSEType;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
