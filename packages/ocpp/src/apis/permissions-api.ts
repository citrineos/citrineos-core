// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type BuiltEndpoint, AbstractEndpointApi } from '@citrineos/base';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import type { Logger } from 'tslog';

export const PERMISSIONS_ENDPOINT_PREFIX = '/permissions';

export class PermissionsApi extends AbstractEndpointApi {
  constructor({
    server,
    permissionEndpoints,
    logger,
  }: {
    server: FastifyInstance;
    permissionEndpoints: BuiltEndpoint[];
    logger?: Logger<ILogObj>;
  }) {
    super(server, PERMISSIONS_ENDPOINT_PREFIX, permissionEndpoints, logger);
  }
}
