// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
} from '@citrineos/base';
import { type SubscriptionDto, HttpMethod } from '@citrineos/types';
import type { ChargingStationKeyQuerystring, ISubscriptionRepository } from '@citrineos/dal';
import { ChargingStationKeyQuerySchema } from '@citrineos/dal';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  subscriptionRepository: ISubscriptionRepository;
}

type Route = { Querystring: ChargingStationKeyQuerystring };

export class GetSubscriptionsEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Get,
    path: '/subscription',
    querySchema: ChargingStationKeyQuerySchema,
  };

  private readonly _subscriptionRepository: ISubscriptionRepository;

  constructor({ logger, subscriptionRepository }: Deps) {
    super(logger);
    this._subscriptionRepository = subscriptionRepository;
  }

  async handle(request: FastifyRequest<Route>): Promise<SubscriptionDto[]> {
    return this._subscriptionRepository.readAllByStationId(
      request.query.tenantId,
      request.query.ocppConnectionName,
    );
  }
}
