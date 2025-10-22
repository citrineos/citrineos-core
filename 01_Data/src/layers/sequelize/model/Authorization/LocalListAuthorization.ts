// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { TenantDto } from '@citrineos/base';
import {
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { type AuthorizationRestrictions } from '../../../../interfaces/index.js';
import { Tenant } from '../Tenant.js';
import { Authorization, LocalListVersion, SendLocalList } from './index.js';
import { LocalListVersionAuthorization } from './LocalListVersionAuthorization.js';
import { SendLocalListAuthorization } from './SendLocalListAuthorization.js';

/**
 *
 * This class represents static information about an authorization used in a local auth list.
 * When a local auth list is put onto the charging station, the state of those authorizations is no longer tied to the actual authorization.
 * Example: A charger receives a local auth list with Authorization id = 1 in it, but then Authorization id = 1 is deleted.
 * Authorization id = 1 is still on the auth list and must be returned when upstream systems check the state of the auth list for that station, until a SendLocalListRequest removing it is successfully processed.
 * To facilitate that, this collection exists to reflect the state of Authorizations as they exist on charging stations' local auth lists.
 * In turn, the 'authorization' relation on this table links back to the "actual" authorization.
 *
 **/
@Table // implements the same as Authorization, not OCPP2_0_1.AuthorizationData
export class LocalListAuthorization extends Model implements AuthorizationRestrictions {
  static readonly MODEL_NAME: string = 'LocalListAuthorization';

  @Column(DataType.ARRAY(DataType.STRING))
  declare allowedConnectorTypes?: string[];

  @Column(DataType.ARRAY(DataType.STRING))
  declare disallowedEvseIdPrefixes?: string[];

  @Column(DataType.STRING)
  declare idToken: string;

  @Column(DataType.STRING)
  declare idTokenType?: string | null;

  @Column(DataType.JSONB)
  declare additionalInfo?: any | null;

  @Column(DataType.STRING)
  declare status: string;

  @Column(DataType.DATE)
  declare cacheExpiryDateTime?: string | null;

  @Column(DataType.INTEGER)
  declare chargingPriority?: number | null;

  @Column(DataType.STRING)
  declare language1?: string | null;

  @Column(DataType.STRING)
  declare language2?: string | null;

  @Column(DataType.JSON)
  declare personalMessage?: any | null;

  @ForeignKey(() => Authorization)
  @Column(DataType.INTEGER)
  declare groupAuthorizationId?: number | null;

  @BelongsTo(() => Authorization, { foreignKey: 'groupAuthorizationId', as: 'groupAuthorization' })
  declare groupAuthorization?: Authorization;

  @ForeignKey(() => Authorization)
  @Column(DataType.INTEGER)
  declare authorizationId?: string;

  @BelongsTo(() => Authorization, { foreignKey: 'authorizationId', as: 'authorization' })
  declare authorization?: Authorization;

  @BelongsToMany(() => SendLocalList, () => SendLocalListAuthorization)
  declare sendLocalLists?: SendLocalList[];

  @BelongsToMany(() => LocalListVersion, () => LocalListVersionAuthorization)
  declare localListVersions?: LocalListVersion[];

  declare customData?: any | null;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  })
  declare tenantId: number;

  @BelongsTo(() => Tenant)
  declare tenant?: TenantDto;

  @BeforeUpdate
  @BeforeCreate
  static setDefaultTenant(instance: LocalListAuthorization) {
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
