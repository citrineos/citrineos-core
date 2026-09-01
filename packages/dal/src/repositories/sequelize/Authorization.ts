// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IAuthorizationRepository } from '../repositories.js';
import { type AuthorizationQuerystring } from '../../interfaces/queries/Authorization.js';
import { Authorization } from '../../models/Authorization/Authorization.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import { Op } from 'sequelize';
import { Tariff } from '@dal/models/Tariff/Tariffs.js';

export class SequelizeAuthorizationRepository
  extends SequelizeRepository<Authorization>
  implements IAuthorizationRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: Authorization.MODEL_NAME, logger, sequelizeInstance });
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

  async findAllAuthorizationsWithTariffs(tenantId: number): Promise<Authorization[]> {
    return await super.readAllByQuery(tenantId, {
      where: {
        tenantId,
        tariffId: { [Op.ne]: null },
      },
      include: [
        {
          model: Tariff,
          as: 'tariff',
          required: true,
        },
      ],
    });
  }

  /**
   * Private Methods
   */

  private _constructQuery(queryParams: AuthorizationQuerystring): object {
    const where: any = {};
    if (queryParams.idToken) {
      where.idToken = queryParams.idToken;
    }
    // 1.6 doesn't have the concept of token type. But we need to support token type for 2.0.1 messages.
    if (queryParams.type) {
      where.idTokenType = queryParams.type;
    }

    if (queryParams.id) {
      where.id = queryParams.id;
    }

    return {
      where,
      // Eager-load the group Authorization so IdTokenInfo.groupIdToken can be surfaced.
      include: [{ model: Authorization, as: 'groupAuthorization' }],
    };
  }
}

export default SequelizeAuthorizationRepository;
