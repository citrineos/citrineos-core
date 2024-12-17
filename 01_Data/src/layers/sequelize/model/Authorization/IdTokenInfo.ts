// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace, OCPP2_0_1 } from '@citrineos/base';
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { IdToken } from './IdToken';

@Table
export class IdTokenInfo extends Model implements OCPP2_0_1.IdTokenInfoType {
  static readonly MODEL_NAME: string = Namespace.IdTokenInfoType;

  @Column(DataType.STRING)
  declare status: OCPP2_0_1.AuthorizationStatusEnumType;

  @Column(DataType.STRING)
  declare cacheExpiryDateTime?: string | null;

  @Column(DataType.INTEGER)
  declare chargingPriority?: number | null;

  @Column(DataType.STRING)
  declare language1?: string | null;

  // Here for compliance with interface; this is a computed property based on the context of a specific authorization request.
  evseId?: [number, ...number[]] | null;

  @ForeignKey(() => IdToken)
  @Column(DataType.INTEGER)
  declare groupIdTokenId?: number | null;

  @BelongsTo(() => IdToken)
  declare groupIdToken?: IdToken;

  @Column(DataType.STRING)
  declare language2?: string | null;

  @Column(DataType.JSON)
  declare personalMessage?: OCPP2_0_1.MessageContentType | null;

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
