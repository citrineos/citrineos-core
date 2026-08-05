// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type BootstrapConfig,
  type IEndpointDefinition,
  AbstractEndpoint,
} from '@citrineos/base';
import { type SystemConfig, HttpMethod } from '@citrineos/types';

interface Deps extends AbstractEndpointDependencies {
  config: BootstrapConfig & SystemConfig;
}

export class GetSystemConfigEndpoint extends AbstractEndpoint {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Get,
    path: '/systemConfig',
  };

  private readonly _config: BootstrapConfig & SystemConfig;

  constructor({ logger, config }: Deps) {
    super(logger);
    this._config = config;
  }

  async handle(): Promise<BootstrapConfig & SystemConfig> {
    return this._config;
  }
}
