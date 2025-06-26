// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, BootstrapConfig } from '@citrineos/base';
import { type AuthorizationQuerystring, type IAuthorizationRepository } from '../../../interfaces';
import { AdditionalInfo, Authorization, IdToken, IdTokenInfo } from '../model/Authorization';
import { SequelizeRepository } from './Base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { IdTokenAdditionalInfo } from '../model/Authorization/IdTokenAdditionalInfo';

export class SequelizeAuthorizationRepository
  extends SequelizeRepository<Authorization>
  implements IAuthorizationRepository
{
  idToken: CrudRepository<IdToken>;
  idTokenInfo: CrudRepository<IdTokenInfo>;
  additionalInfo: CrudRepository<AdditionalInfo>;
  idTokenAdditionalInfo: CrudRepository<IdTokenAdditionalInfo>;

  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
    idToken?: CrudRepository<IdToken>,
    idTokenInfo?: CrudRepository<IdTokenInfo>,
    additionalInfo?: CrudRepository<AdditionalInfo>,
    idTokenAdditionalInfo?: CrudRepository<IdTokenAdditionalInfo>,
  ) {
    super(config, Authorization.MODEL_NAME, logger, sequelizeInstance);
    this.idToken = idToken
      ? idToken
      : new SequelizeRepository<IdToken>(config, IdToken.MODEL_NAME, logger, sequelizeInstance);
    this.idTokenInfo = idTokenInfo
      ? idTokenInfo
      : new SequelizeRepository<IdTokenInfo>(
          config,
          IdTokenInfo.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.additionalInfo = additionalInfo
      ? additionalInfo
      : new SequelizeRepository<AdditionalInfo>(
          config,
          AdditionalInfo.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.idTokenAdditionalInfo = idTokenAdditionalInfo
      ? idTokenAdditionalInfo
      : new SequelizeRepository<IdTokenAdditionalInfo>(
          config,
          IdTokenAdditionalInfo.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
  }

  async readAllByQuerystring(
    tenantId: number,
    query: AuthorizationQuerystring,
  ): Promise<Authorization[]> {
    return await super.readAllByQuery(tenantId, this._constructQuery(query));
  }

  async readOnlyOneByQuerystring(
    tenantId: number,
    query: AuthorizationQuerystring,
  ): Promise<Authorization | undefined> {
    return await super.readOnlyOneByQuery(tenantId, this._constructQuery(query));
  }

  /**
   * Private Methods
   */

  private _constructQuery(queryParams: AuthorizationQuerystring): object {
    // 1.6 doesn't have the concept of token type. But we need to support token type for 2.0.1 messages.
    // We ignore token type if it's explicitly set to null, as it's coming from a 1.6 message
    const idTokenWhere: any = {};
    if (queryParams.idToken) {
      // exact match
      idTokenWhere.idToken = queryParams.idToken;
      // or partial match:
      // idTokenWhere.idToken = { [Op.like]: `%${queryParams.idToken}%` };
    }

    // only include type if it's provided
    if (queryParams.type) {
      idTokenWhere.type = queryParams.type;
    }

    return {
      where: {},
      include: [
        {
          model: IdToken,
          where: idTokenWhere,
          required: true, // This ensures the inner join, so only Authorizations with the matching IdToken are returned
        },
        { model: IdTokenInfo, include: [{ model: IdToken, include: [AdditionalInfo] }] },
      ],
    };
  }
}
