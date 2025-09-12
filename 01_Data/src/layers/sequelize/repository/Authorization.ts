// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BootstrapConfig } from '@citrineos/base';
import { type AuthorizationQuerystring, type IAuthorizationRepository } from '../../../interfaces';
import { Authorization } from '../model/Authorization';
import { SequelizeRepository } from './Base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';

export class SequelizeAuthorizationRepository
  extends SequelizeRepository<Authorization>
  implements IAuthorizationRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, Authorization.MODEL_NAME, logger, sequelizeInstance);
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

    const where: any = {};
    if (queryParams.idToken) {
      where.idToken = queryParams.idToken;
    }
    if (queryParams.type) {
      where.idTokenType = queryParams.type;
    }

    return {
      where,
    };
  }
}
