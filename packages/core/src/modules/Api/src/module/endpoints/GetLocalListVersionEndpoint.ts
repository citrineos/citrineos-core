// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type IEndpointDefinition,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { ChargingStationKeyQuerystring } from '@dal/interfaces/index.js';
import { ChargingStationKeyQuerySchema } from '@dal/interfaces/index.js';
import type { ILocalAuthListRepository } from '@dal/interfaces/repositories.js';
import { LocalListAuthorization, type LocalListVersion } from '@dal/layers/sequelize/index.js';
import type { FastifyRequest } from 'fastify';

interface GetLocalListVersionEndpointDependencies extends AbstractEndpointDependencies {
  localAuthListRepository: ILocalAuthListRepository;
}

type GetLocalListVersionRoute = { Querystring: ChargingStationKeyQuerystring };

export class GetLocalListVersionEndpoint extends AbstractEndpoint<GetLocalListVersionRoute> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Get,
    path: '/localListVersion',
    querySchema: ChargingStationKeyQuerySchema,
  };

  private readonly _localAuthListRepository: ILocalAuthListRepository;

  constructor({ logger, localAuthListRepository }: GetLocalListVersionEndpointDependencies) {
    super(logger);
    this._localAuthListRepository = localAuthListRepository;
  }

  async handle(
    request: FastifyRequest<GetLocalListVersionRoute>,
  ): Promise<LocalListVersion | undefined> {
    const tenantId = request.query.tenantId;
    return this._localAuthListRepository.readOnlyOneByQuery(tenantId, {
      where: {
        tenantId,
        ocppConnectionName: request.query.ocppConnectionName,
      },
      include: [LocalListAuthorization],
    });
  }
}
