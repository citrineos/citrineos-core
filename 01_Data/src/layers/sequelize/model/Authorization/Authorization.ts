// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  AdditionalInfo,
  AuthorizationDto,
  AuthorizationStatusEnumType,
  AuthorizationWhitelistEnumType,
  IdTokenEnumType,
  RealTimeAuthLastAttempt,
} from '@citrineos/base';
import { Namespace } from '@citrineos/base';
import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { AuthorizationLocation } from '../AuthorizationLocation.js';
import { AuthorizationTenant } from '../AuthorizationTenant.js';
import { TenantPartner } from '../TenantPartner.js';
import { RoamingPartner } from '../RoamingPartner.js';

@Table
export class Authorization extends Model implements AuthorizationDto {
  static readonly MODEL_NAME: string = Namespace.AuthorizationData;

  @Column(DataType.ARRAY(DataType.STRING))
  declare allowedConnectorTypes?: string[];

  @Column(DataType.ARRAY(DataType.STRING))
  declare disallowedEvseIdPrefixes?: string[];

  @Column({
    type: DataType.CITEXT,
    unique: 'idToken_type',
  })
  declare idToken: string;

  @Column({
    type: DataType.STRING,
    unique: 'idToken_type',
  })
  declare idTokenType?: IdTokenEnumType | null;

  @Column(DataType.JSONB)
  declare additionalInfo?: [AdditionalInfo, ...AdditionalInfo[]] | null; // JSONB for AdditionalInfo

  @Column(DataType.STRING)
  declare status: AuthorizationStatusEnumType;

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
  declare realTimeAuth?: AuthorizationWhitelistEnumType | null;

  @Column(DataType.JSONB)
  declare realTimeAuthLastAttempt?: RealTimeAuthLastAttempt | null;

  @Column(DataType.INTEGER)
  declare realTimeAuthTimeout?: number | null;

  @Column(DataType.STRING)
  declare realTimeAuthUrl?: string;

  @HasMany(() => AuthorizationTenant, { foreignKey: 'authorizationId', as: 'tenants' })
  declare tenants?: AuthorizationTenant[] | null;

  @HasMany(() => AuthorizationLocation, { foreignKey: 'authorizationId', as: 'locations' })
  declare locations?: AuthorizationLocation[] | null;

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

  @ForeignKey(() => RoamingPartner)
  @Column({ type: DataType.INTEGER, allowNull: true, onUpdate: 'CASCADE', onDelete: 'SET NULL' })
  declare roamingPartnerId?: number | null;

  @BelongsTo(() => RoamingPartner)
  declare roamingPartner?: RoamingPartner;
}
