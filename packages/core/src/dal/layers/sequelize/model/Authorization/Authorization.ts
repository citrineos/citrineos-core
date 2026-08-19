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
  TariffDto,
  TenantDto,
  TenantPartnerDto,
  TransactionDto,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, Namespace } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Tenant } from '../Tenant.js';
import { TenantPartner } from '../TenantPartner.js';
import { Transaction } from '../TransactionEvent/Transaction.js';
import { Tariff } from '../Tariff/Tariffs.js';

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
    allowNull: false,
  })
  declare idToken: string;

  @Column({
    type: DataType.STRING,
    unique: 'idToken_type',
  })
  declare idTokenType?: IdTokenEnumType | null;

  @Column(DataType.JSONB)
  declare additionalInfo?: [AdditionalInfo, ...AdditionalInfo[]] | null; // JSONB for AdditionalInfo

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
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
  @ForeignKey(() => Authorization)
  @Column(DataType.INTEGER)
  declare groupAuthorizationId?: number | null;

  @ForeignKey(() => Tariff)
  @Column(DataType.INTEGER)
  declare tariffId?: number | null;

  @BelongsTo(() => Authorization, { foreignKey: 'groupAuthorizationId', as: 'groupAuthorization' })
  declare groupAuthorization?: Authorization;

  @BelongsTo(() => Tariff, { foreignKey: 'tariffId', as: 'tariff' })
  declare tariff?: TariffDto | null;

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare concurrentTransaction?: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isPrepaid?: boolean;

  @Column(DataType.DECIMAL)
  declare prepaidBalance?: number | null;

  declare customData?: any | null;

  // For cases where Authorization is owned by an upstream partner, i.e. an eMSP
  @ForeignKey(() => TenantPartner)
  @Column(DataType.INTEGER)
  declare tenantPartnerId?: number | null;

  @BelongsTo(() => TenantPartner, {
    foreignKey: 'tenantPartnerId',
    as: 'authTenantPartnerAuthorization',
  })
  declare tenantPartner?: TenantPartnerDto | null;

  @HasMany(() => Transaction, 'authorizationId')
  declare transactions?: TransactionDto[];

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: 'idToken_type',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant, 'tenantId')
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
