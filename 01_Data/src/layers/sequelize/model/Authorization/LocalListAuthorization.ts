// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1, OCPP2_0_1_Namespace } from '@citrineos/base';
import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { type AuthorizationRestrictions } from '../../../../interfaces';
import { Authorization, SendLocalList, LocalListVersion } from '.';
import { SendLocalListAuthorization } from './SendLocalListAuthorization';
import { LocalListVersionAuthorization } from './LocalListVersionAuthorization';
import { BaseModelWithTenant } from '../BaseModelWithTenant';

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
export class LocalListAuthorization
  extends BaseModelWithTenant
  implements AuthorizationRestrictions
{
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
}
