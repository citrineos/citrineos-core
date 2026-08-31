// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OcpiConfig } from '../../index.js';
import { OcpiModule } from '../../index.js';
import type { CacheWrapper } from '../../index.js';
import type { OcpiModuleDependencies } from '../../dependencies.js';

import { CredentialsModuleApi } from './module/CredentialsModuleApi.js';
import type { ILogObj, Logger } from 'tslog';

export { CredentialsModuleApi } from './module/CredentialsModuleApi.js';
export type { ICredentialsModuleApi } from './module/ICredentialsModuleApi.js';

export class CredentialsModule implements OcpiModule {
  readonly config: OcpiConfig;
  readonly cacheWrapper: CacheWrapper;
  readonly logger: Logger<ILogObj>;

  constructor({ config, cacheWrapper, logger }: OcpiModuleDependencies) {
    this.config = config;
    this.cacheWrapper = cacheWrapper;
    this.logger = logger;
  }

  getController(): any {
    return CredentialsModuleApi;
  }
}
