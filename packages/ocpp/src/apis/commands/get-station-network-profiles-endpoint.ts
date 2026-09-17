// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
} from '@citrineos/base';
import { type ChargingStationNetworkProfileDto, HttpMethod } from '@citrineos/types';
import type { NetworkProfileQuerystring } from '@citrineos/dal';
import { NetworkProfileQuerySchema } from '@citrineos/dal';
import type { IChargingStationNetworkProfileRepository } from '@citrineos/dal';
import type { FastifyRequest } from 'fastify';

interface GetStationNetworkProfilesEndpointDependencies extends AbstractEndpointDependencies {
  chargingStationNetworkProfileRepository: IChargingStationNetworkProfileRepository;
}

type GetStationNetworkProfilesRoute = { Querystring: NetworkProfileQuerystring };

export class GetStationNetworkProfilesEndpoint extends AbstractEndpoint<GetStationNetworkProfilesRoute> {
  static readonly route: ICommandEndpointMetadata = {
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
  ): Promise<ChargingStationNetworkProfileDto[]> {
    return this._chargingStationNetworkProfileRepository.readAllByStationIdWithProfiles(
      request.query.tenantId,
      request.query.ocppConnectionName,
    );
  }
}
