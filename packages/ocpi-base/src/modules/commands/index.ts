// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CommandsModuleApi } from './module/commands-module-api.js';
import type { OcpiConfig } from '../../index.js';
import { OcpiModule } from '../../index.js';
import type { CacheWrapper } from '../../index.js';
import type { OcpiModuleDependencies } from '../../dependencies.js';
import type { ILogObj, Logger } from 'tslog';

export { CommandsModuleApi } from './module/commands-module-api.js';
export type { ICommandsModuleApi } from './module/i-commands-module-api.js';

export class CommandsModule implements OcpiModule {
  readonly config: OcpiConfig;
  readonly cacheWrapper: CacheWrapper;
  readonly logger: Logger<ILogObj>;

  constructor({ config, cacheWrapper, logger }: OcpiModuleDependencies) {
    this.config = config;
    this.cacheWrapper = cacheWrapper;
    this.logger = logger;
  }

  getController(): any {
    return CommandsModuleApi;
  }
}
