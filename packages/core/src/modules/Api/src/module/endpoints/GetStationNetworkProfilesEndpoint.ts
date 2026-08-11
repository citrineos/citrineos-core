// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type IEndpointDefinition,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { NetworkProfileQuerystring } from '@dal/interfaces/index.js';
import { NetworkProfileQuerySchema } from '@dal/interfaces/index.js';
import type { IChargingStationNetworkProfileRepository } from '@dal/interfaces/repositories.js';
import {
  type ChargingStationNetworkProfile,
  ServerNetworkProfile,
  SetNetworkProfile,
} from '@dal/layers/sequelize/index.js';
import type { FastifyRequest } from 'fastify';

interface GetStationNetworkProfilesEndpointDependencies extends AbstractEndpointDependencies {
  chargingStationNetworkProfileRepository: IChargingStationNetworkProfileRepository;
}

type GetStationNetworkProfilesRoute = { Querystring: NetworkProfileQuerystring };

export class GetStationNetworkProfilesEndpoint extends AbstractEndpoint<GetStationNetworkProfilesRoute> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Get,
    path: '/stationNetworkProfile',
    querySchema: NetworkProfileQuerySchema,
  };

  private readonly _chargingStationNetworkProfileRepository: IChargingStationNetworkProfileRepository;

  constructor({
    logger,
    chargingStationNetworkProfileRepository,
  }: GetStationNetworkProfilesEndpointDependencies) {
    super(logger);
    this._chargingStationNetworkProfileRepository = chargingStationNetworkProfileRepository;
  }

  async handle(
    request: FastifyRequest<GetStationNetworkProfilesRoute>,
  ): Promise<ChargingStationNetworkProfile[]> {
    return this._chargingStationNetworkProfileRepository.readAllByQuery(request.query.tenantId, {
      where: {
        ocppConnectionName: request.query.ocppConnectionName,
        tenantId: request.query.tenantId,
      },
      include: [SetNetworkProfile, ServerNetworkProfile],
    });
  }
}
