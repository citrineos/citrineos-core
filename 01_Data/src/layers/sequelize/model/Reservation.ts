// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  ConnectorEnumType,
  CustomDataType, EVSEType,
  Namespace,
  ReserveNowRequest, ReserveNowStatusEnumType,
} from '@citrineos/base';
import { AutoIncrement, BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Evse } from './DeviceModel';
import { IdToken } from './Authorization';

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
  declare connectorType?: ConnectorEnumType;

  @Column(DataType.STRING)
  declare reserveStatus?: ReserveNowStatusEnumType;

  @Column({type: DataType.BOOLEAN, defaultValue: true})
  declare isActive: boolean;

  @Column(DataType.STRING)
  declare terminatedByTransaction?: string;

  /**
   * Relations
   */
  @ForeignKey(() => Evse)
  declare evseId?: number;

  @BelongsTo(() => Evse)
  declare evse?: EVSEType;

  @ForeignKey(() => IdToken)
  declare idTokenId: number;

  @BelongsTo(() => IdToken)
  declare idToken: IdToken;

  @ForeignKey(() => IdToken)
  declare groupIdTokenId?: number;

  @BelongsTo(() => IdToken)
  declare groupIdToken?: IdToken;

  declare customData?: CustomDataType | undefined;
}
