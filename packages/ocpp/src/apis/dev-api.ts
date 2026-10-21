// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type BuiltEndpoint, AbstractEndpointApi } from '@citrineos/base';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import type { Logger } from 'tslog';

export const DEV_ENDPOINT_PREFIX = '/dev';

export class DevApi extends AbstractEndpointApi {
  constructor({
    server,
    devEndpoints,
    logger,
  }: {
    server: FastifyInstance;
    devEndpoints: BuiltEndpoint[];
    logger?: Logger<ILogObj>;
  }) {
    super(server, DEV_ENDPOINT_PREFIX, devEndpoints, logger);
  }
}
