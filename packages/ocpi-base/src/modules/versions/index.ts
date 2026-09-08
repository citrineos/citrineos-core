// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { OcpiConfig } from '../../index.js';
import { OcpiModule } from '../../index.js';
import type { CacheWrapper } from '../../index.js';
import type { OcpiModuleDependencies } from '../../dependencies.js';
import { VersionsModuleApi } from './module/versions-module-api.js';
import type { ILogObj, Logger } from 'tslog';

export { VersionsModuleApi } from './module/versions-module-api.js';
export type { IVersionsModuleApi } from './module/i-versions-module-api.js';

export class VersionsModule implements OcpiModule {
  readonly config: OcpiConfig;
  readonly cacheWrapper: CacheWrapper;
  readonly logger: Logger<ILogObj>;

  constructor({ config, cacheWrapper, logger }: OcpiModuleDependencies) {
    this.config = config;
    this.cacheWrapper = cacheWrapper;
    this.logger = logger;
  }

  public getController(): any {
    return VersionsModuleApi;
  }
}
