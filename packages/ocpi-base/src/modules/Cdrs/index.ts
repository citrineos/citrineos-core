// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CdrsModuleApi } from './module/CdrsModuleApi.js';
import { OcpiModule } from '../../index.js';
import type { CacheWrapper } from '../../index.js';
import type { OcpiModuleDependencies } from '../../dependencies.js';
import type { ILogObj, Logger } from 'tslog';

export { CdrsModuleApi } from './module/CdrsModuleApi.js';
export type { ICdrsModuleApi } from './module/ICdrsModuleApi.js';

// Cdr pushes are triggered by session updates in the Sessions module.
export class CdrsModule implements OcpiModule {
  readonly cacheWrapper: CacheWrapper;
  readonly logger: Logger<ILogObj>;

  constructor({ cacheWrapper, logger }: OcpiModuleDependencies) {
    this.cacheWrapper = cacheWrapper;
    this.logger = logger;
  }

  getController(): any {
    return CdrsModuleApi;
  }
}
