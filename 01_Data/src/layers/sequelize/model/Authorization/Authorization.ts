// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Namespace } from '@citrineos/base';
import { BelongsTo, Column, DataType, Default, ForeignKey, Table } from 'sequelize-typescript';
import { type AuthorizationRestrictions } from '../../../../interfaces';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

@Table
export class Authorization extends BaseModelWithTenant implements AuthorizationRestrictions {
  static readonly MODEL_NAME: string = Namespace.AuthorizationData;

  @Column(DataType.ARRAY(DataType.STRING))
  declare allowedConnectorTypes?: string[];

  @Column(DataType.ARRAY(DataType.STRING))
  declare disallowedEvseIdPrefixes?: string[];

  // IdToken fields
  @Column({
    type: DataType.STRING,
    unique: 'idToken_type',
  })
  declare idToken: string;

  @Column({
    type: DataType.STRING,
    unique: 'idToken_type',
  })
  declare type?: string | null;

  @Column(DataType.JSONB)
  declare additionalInfo?: any | null;

  // IdTokenInfo fields
  @Column(DataType.STRING)
  declare status: string;

  @Column({
    type: DataType.DATE,
    get() {
      return this.getDataValue('cacheExpiryDateTime')?.toISOString();
    },
  })
  declare cacheExpiryDateTime?: string | null;

  @Column(DataType.INTEGER)
  declare chargingPriority?: number | null;

  @Column(DataType.STRING)
  declare language1?: string | null;

  @Column(DataType.STRING)
  declare language2?: string | null;

  @Column(DataType.JSON)
  declare personalMessage?: any | null;

  // Self-reference for groupIdToken
  @ForeignKey(() => Authorization)
  @Column(DataType.INTEGER)
  declare groupIdTokenId?: number | null;

  @BelongsTo(() => Authorization, { foreignKey: 'groupIdTokenId', as: 'groupIdToken' })
  declare groupIdToken?: Authorization;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare concurrentTransaction?: boolean;

  @Column(DataType.JSON)
  declare customData?: any | null;
}
