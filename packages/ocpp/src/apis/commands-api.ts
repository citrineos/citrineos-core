// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type BuiltEndpoint, AbstractEndpointApi } from '@citrineos/base';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import type { Logger } from 'tslog';

export const COMMANDS_ENDPOINT_PREFIX = '/commands';

export class CommandsApi extends AbstractEndpointApi {
  constructor({
    server,
    commandEndpoints,
    logger,
  }: {
    server: FastifyInstance;
    commandEndpoints: BuiltEndpoint[];
    logger?: Logger<ILogObj>;
  }) {
    super(server, COMMANDS_ENDPOINT_PREFIX, commandEndpoints, logger);
  }
}
