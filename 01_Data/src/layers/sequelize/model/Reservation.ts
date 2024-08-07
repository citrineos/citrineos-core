// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ConnectorEnumType, CustomDataType, EVSEType, IdTokenType, Namespace, ReserveNowRequest, ReserveNowStatusEnumType } from '@citrineos/base';
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Evse } from './DeviceModel';

@Table
export class Reservation extends Model implements ReserveNowRequest {
  static readonly MODEL_NAME: string = Namespace.ReserveNowRequest;

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
  declare connectorType?: ConnectorEnumType | null;

  @Column(DataType.STRING)
  declare reserveStatus?: ReserveNowStatusEnumType | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isActive: boolean;

  @Column(DataType.STRING)
  declare terminatedByTransaction?: string | null;

  @Column(DataType.JSONB)
  declare idToken: IdTokenType;

  @Column(DataType.JSONB)
  declare groupIdToken?: IdTokenType | null;

  /**
   * Relations
   */
  @ForeignKey(() => Evse)
  declare evseId?: number | null;

  @BelongsTo(() => Evse)
  declare evse?: EVSEType;

  declare customData?: CustomDataType | null;
}
