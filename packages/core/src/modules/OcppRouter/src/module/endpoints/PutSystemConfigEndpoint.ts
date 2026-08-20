// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type BootstrapConfig,
  type ConfigStore,
  type ICommandEndpointMetadata,
  AbstractEndpoint,
} from '@citrineos/base';
import { type SystemConfig, HttpMethod, systemConfigSchema } from '@citrineos/types';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';

interface Deps extends AbstractEndpointDependencies {
  config: BootstrapConfig & SystemConfig;
  configStore: ConfigStore;
}

type Route = { Body: SystemConfig };

export class PutSystemConfigEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Put,
    path: '/systemConfig',
    bodySchema: {
      ...z.toJSONSchema(systemConfigSchema, { target: 'openapi-3.0' }),
      $id: 'SystemConfigSchema',
    },
  };

  private readonly _config: BootstrapConfig & SystemConfig;
  private readonly _configStore: ConfigStore;

  constructor({ logger, config, configStore }: Deps) {
    super(logger);
    this._config = config;
    this._configStore = configStore;
  }

  async handle(request: FastifyRequest<Route>): Promise<void> {
    await this._configStore.saveConfig(request.body);
    Object.assign(this._config, request.body);
  }
}
