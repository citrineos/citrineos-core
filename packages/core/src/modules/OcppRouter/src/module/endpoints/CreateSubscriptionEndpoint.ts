// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
  BadRequestError,
} from '@citrineos/base';
import { type SubscriptionDto, HttpMethod } from '@citrineos/types';
import type { ISubscriptionRepository, TenantQueryString } from '@dal/interfaces/index.js';
import { CreateSubscriptionSchema, TenantQuerySchema } from '@dal/interfaces/index.js';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  subscriptionRepository: ISubscriptionRepository;
}

type Route = { Body: SubscriptionDto; Querystring: TenantQueryString };

export class CreateSubscriptionEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Post,
    path: '/subscription',
    querySchema: TenantQuerySchema,
    bodySchema: CreateSubscriptionSchema,
  };

  private readonly _subscriptionRepository: ISubscriptionRepository;

  constructor({ logger, subscriptionRepository }: Deps) {
    super(logger);
    this._subscriptionRepository = subscriptionRepository;
  }

  async handle(request: FastifyRequest<Route>): Promise<number> {
    const tenantId = request.query.tenantId;
    request.body.tenantId = tenantId;
    if (
      !request.body.onClose &&
      !request.body.onConnect &&
      !request.body.onMessage &&
      !request.body.sentMessage
    ) {
      throw new BadRequestError(
        'Must specify at least one of onConnect, onClose, onMessage, sentMessage to true.',
      );
    }
    return this._subscriptionRepository
      .create(tenantId, request.body as SubscriptionDto)
      .then((subscription) => subscription.id!);
  }
}
