// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type BuiltEndpoint, AbstractEndpointApi } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';
import type { FastifyInstance } from 'fastify';
import type { ILogObj, Logger } from 'tslog';

export class WebPaymentApi extends AbstractEndpointApi {
  constructor({
    server,
    webPaymentEndpoints,
    logger,
  }: {
    server: FastifyInstance;
    webPaymentEndpoints: BuiltEndpoint[];
    logger?: Logger<ILogObj>;
  }) {
    super(server, EventGroup.EVDriver, webPaymentEndpoints, logger);
  }
}
