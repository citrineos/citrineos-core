// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type ILogObj, Logger } from 'tslog';
import type { FastifyReply, FastifyRequest, RouteGenericInterface } from 'fastify';

// This interface is longer than just including logger itself
// but was intentionally left in so that common additions are easily included
export interface AbstractEndpointDependencies {
  logger: Logger<ILogObj>;
}

export abstract class AbstractEndpoint<
  TRoute extends RouteGenericInterface = RouteGenericInterface,
> {
  protected readonly _logger: Logger<ILogObj>;

  constructor(logger: Logger<ILogObj>) {
    this._logger = logger.getSubLogger({ name: this.constructor.name });
  }

  public abstract handle(request: FastifyRequest<TRoute>, reply: FastifyReply): Promise<unknown>;
}
