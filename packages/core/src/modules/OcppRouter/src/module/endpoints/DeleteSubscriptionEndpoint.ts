// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/types';
import type { ISubscriptionRepository, ModelKeyQuerystring } from '@dal/interfaces/index.js';
import { ModelKeyQuerystringSchema } from '@dal/interfaces/index.js';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  subscriptionRepository: ISubscriptionRepository;
}

type Route = { Querystring: ModelKeyQuerystring };

export class DeleteSubscriptionEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Delete,
    path: '/subscription',
    querySchema: ModelKeyQuerystringSchema,
  };

  private readonly _subscriptionRepository: ISubscriptionRepository;

  constructor({ logger, subscriptionRepository }: Deps) {
    super(logger);
    this._subscriptionRepository = subscriptionRepository;
  }

  async handle(request: FastifyRequest<Route>): Promise<boolean> {
    const tenantId = request.query.tenantId ?? DEFAULT_TENANT_ID;
    return this._subscriptionRepository
      .deleteByKey(tenantId, request.query.id.toString())
      .then(() => true);
  }
}
