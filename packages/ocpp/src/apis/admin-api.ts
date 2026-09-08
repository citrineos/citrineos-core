// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type BuiltEndpoint, AbstractEndpointApi } from '@citrineos/base';
import type { FastifyInstance } from 'fastify';
import type { ILogObj, Logger } from 'tslog';

export const ADMIN_ENDPOINT_PREFIX = '/ocpprouter';

export class AdminApi extends AbstractEndpointApi {
  constructor({
    server,
    adminEndpoints,
    logger,
  }: {
    server: FastifyInstance;
    adminEndpoints: BuiltEndpoint[];
    logger?: Logger<ILogObj>;
  }) {
    super(server, ADMIN_ENDPOINT_PREFIX, adminEndpoints, logger);
  }
}
