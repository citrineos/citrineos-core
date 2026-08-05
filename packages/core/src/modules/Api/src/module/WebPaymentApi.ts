// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type BuiltEndpoint, AbstractEndpointApi } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import type { FastifyInstance } from 'fastify';
import type { ILogObj, Logger } from 'tslog';

export class WebPaymentApi extends AbstractEndpointApi {
  constructor({
    server,
    config,
    webPaymentEndpoints,
    logger,
  }: {
    server: FastifyInstance;
    config: SystemConfig;
    webPaymentEndpoints: BuiltEndpoint[];
    logger?: Logger<ILogObj>;
  }) {
    super(server, config.modules.evdriver.endpointPrefix, webPaymentEndpoints, logger);
  }
}
