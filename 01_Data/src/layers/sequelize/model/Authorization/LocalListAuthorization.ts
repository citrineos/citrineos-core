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
import { Authorization, IdToken, IdTokenInfo, LocalListVersion, SendLocalList } from '.';
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
@Table
export class LocalListAuthorization
  extends BaseModelWithTenant
  implements OCPP2_0_1.AuthorizationData, AuthorizationRestrictions
{
  static readonly MODEL_NAME: string = OCPP2_0_1_Namespace.LocalListAuthorization;

  @Column(DataType.ARRAY(DataType.STRING))
  declare allowedConnectorTypes?: string[];

  @Column(DataType.ARRAY(DataType.STRING))
  declare disallowedEvseIdPrefixes?: string[];

  @ForeignKey(() => IdToken)
  @Column(DataType.INTEGER)
  declare idTokenId?: number;

  @BelongsTo(() => IdToken)
  declare idToken: OCPP2_0_1.IdTokenType;

  @ForeignKey(() => IdTokenInfo)
  @Column(DataType.INTEGER)
  declare idTokenInfoId?: number | null;

  @BelongsTo(() => IdTokenInfo)
  declare idTokenInfo?: OCPP2_0_1.IdTokenInfoType;

  @ForeignKey(() => Authorization)
  @Column(DataType.INTEGER)
  declare authorizationId?: string;

  @BelongsTo(() => Authorization)
  declare authorization?: Authorization;

  @BelongsToMany(() => SendLocalList, () => SendLocalListAuthorization)
  declare sendLocalLists?: SendLocalList[];

  @BelongsToMany(() => LocalListVersion, () => LocalListVersionAuthorization)
  declare localListVersions?: LocalListVersion[];

  declare customData?: OCPP2_0_1.CustomDataType | null;
}
