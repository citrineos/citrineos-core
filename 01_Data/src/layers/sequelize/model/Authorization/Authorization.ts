// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AdditionalInfo,
  AuthorizationStatusType,
  IAuthorizationDto,
  IdTokenType,
  Namespace,
  AuthorizationWhitelistType,
} from '@citrineos/base';
import { BelongsTo, Column, DataType, Default, ForeignKey, Table } from 'sequelize-typescript';
import { BaseModelWithTenant } from '../BaseModelWithTenant';
import { TenantPartner } from '../TenantPartner';

@Table
export class Authorization extends BaseModelWithTenant implements IAuthorizationDto {
  static readonly MODEL_NAME: string = Namespace.AuthorizationData;

  @Column(DataType.ARRAY(DataType.STRING))
  declare allowedConnectorTypes?: string[];

  @Column(DataType.ARRAY(DataType.STRING))
  declare disallowedEvseIdPrefixes?: string[];

  @Column({
    type: DataType.STRING,
    unique: 'idToken_type',
  })
  declare idToken: string;

  @Column({
    type: DataType.STRING,
    unique: 'idToken_type',
  })
  declare idTokenType?: IdTokenType | null;

  @Column(DataType.JSONB)
  declare additionalInfo?: [AdditionalInfo, ...AdditionalInfo[]] | null; // JSONB for AdditionalInfo

  @Column(DataType.STRING)
  declare status: AuthorizationStatusType;

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

  @Column(DataType.STRING)
  declare realTimeAuth?: AuthorizationWhitelistType | null;

  @Column(DataType.STRING)
  declare realTimeAuthUrl?: string;

  // Reference to another Authorization for groupAuthorization
  @ForeignKey(() => Authorization)
  @Column(DataType.INTEGER)
  declare groupAuthorizationId?: number | null;

  @BelongsTo(() => Authorization, { foreignKey: 'groupAuthorizationId', as: 'groupAuthorization' })
  declare groupAuthorization?: Authorization;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare concurrentTransaction?: boolean;

  declare customData?: any | null;

  // For cases where Authorization is owned by an upstream partner, i.e. an eMSP
  @ForeignKey(() => TenantPartner)
  @Column(DataType.INTEGER)
  declare tenantPartnerId?: number | null;

  @BelongsTo(() => TenantPartner)
  declare tenantPartner?: TenantPartner | null;
}
