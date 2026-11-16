// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod, type LocalListVersionDto } from '@citrineos/types';
import type { ChargingStationKeyQuerystring } from '@citrineos/dal';
import { ChargingStationKeyQuerySchema } from '@citrineos/dal';
import type { ILocalListVersionRepository } from '@citrineos/dal';
import type { FastifyRequest } from 'fastify';

interface GetLocalListVersionEndpointDependencies extends AbstractEndpointDependencies {
  localListVersionRepository: ILocalListVersionRepository;
}

type GetLocalListVersionRoute = { Querystring: ChargingStationKeyQuerystring };

export class GetLocalListVersionEndpoint extends AbstractEndpoint<GetLocalListVersionRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Get,
    path: '/localListVersion',
    querySchema: ChargingStationKeyQuerySchema,
  };

  private readonly _localListVersionRepository: ILocalListVersionRepository;

  constructor({ logger, localListVersionRepository }: GetLocalListVersionEndpointDependencies) {
    super(logger);
    this._localListVersionRepository = localListVersionRepository;
  }

  async handle(
    request: FastifyRequest<GetLocalListVersionRoute>,
  ): Promise<LocalListVersionDto | undefined> {
    const tenantId = request.query.tenantId;
    return this._localListVersionRepository.readLocalListVersionByStationId(
      tenantId,
      request.query.ocppConnectionName,
    );
  }
}
