// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  type IMessageConfirmation,
  AbstractEndpoint,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { NetworkProfileDeleteQuerystring } from '@citrineos/dal';
import type { IChargingStationNetworkProfileRepository } from '@citrineos/dal';
import { NetworkProfileDeleteQuerySchema } from '@citrineos/dal';
import type { FastifyRequest } from 'fastify';

interface DeleteStationNetworkProfileEndpointDependencies extends AbstractEndpointDependencies {
  chargingStationNetworkProfileRepository: IChargingStationNetworkProfileRepository;
}

type DeleteStationNetworkProfileRoute = { Querystring: NetworkProfileDeleteQuerystring };

export class DeleteStationNetworkProfileEndpoint extends AbstractEndpoint<DeleteStationNetworkProfileRoute> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Delete,
    path: '/stationNetworkProfile',
    querySchema: NetworkProfileDeleteQuerySchema,
  };

  private readonly _chargingStationNetworkProfileRepository: IChargingStationNetworkProfileRepository;

  constructor({
    logger,
    chargingStationNetworkProfileRepository,
  }: DeleteStationNetworkProfileEndpointDependencies) {
    super(logger);
    this._chargingStationNetworkProfileRepository = chargingStationNetworkProfileRepository;
  }

  async handle(
    request: FastifyRequest<DeleteStationNetworkProfileRoute>,
  ): Promise<IMessageConfirmation> {
    const deleted =
      await this._chargingStationNetworkProfileRepository.deleteAllByStationIdAndConfigurationSlots(
        request.query.tenantId,
        request.query.ocppConnectionName,
        request.query.configurationSlot,
      );
    return {
      success: true,
      payload: `${deleted.length} rows successfully destroyed`,
    };
  }
}
