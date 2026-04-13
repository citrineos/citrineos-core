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
  TenantDto,
  TenantPartnerDto,
} from '@citrineos/base';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  Column,
  DataType,
  Default,
  Model,
  Table,
} from 'sequelize-typescript';

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

  // Reference to another Authorization for groupAuthorization
  @Column(DataType.INTEGER)
  declare groupAuthorizationId?: number | null;

  declare groupAuthorization?: Authorization;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare concurrentTransaction?: boolean;

  declare customData?: any | null;

  // For cases where Authorization is owned by an upstream partner, i.e. an eMSP
  @Column(DataType.INTEGER)
  declare tenantPartnerId?: number | null;

  declare tenantPartner?: TenantPartnerDto | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: 'idToken_type',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: Authorization) {
    if (instance.tenantId == null) {
      instance.tenantId = DEFAULT_TENANT_ID;
    }
  }

  constructor(...args: any[]) {
    super(...args);
    if (this.tenantId == null) {
      this.tenantId = DEFAULT_TENANT_ID;
    }
  }
}
