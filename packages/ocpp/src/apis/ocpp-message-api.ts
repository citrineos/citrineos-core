// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type BuiltMessageEndpoint, AbstractMessageEndpointApi } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import type { FastifyInstance } from 'fastify';
import type { ILogObj, Logger } from 'tslog';

export class OcppMessageApi extends AbstractMessageEndpointApi {
  constructor({
    server,
    config,
    messageEndpoints,
    logger,
  }: {
    server: FastifyInstance;
    config: SystemConfig;
    messageEndpoints: BuiltMessageEndpoint[];
    logger?: Logger<ILogObj>;
  }) {
    super(server, config, messageEndpoints, logger);
  }
}
