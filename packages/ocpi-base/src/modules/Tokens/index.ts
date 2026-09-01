// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TokensModuleApi } from './module/TokensModuleApi.js';
import { OcpiModule } from '../../index.js';
import type { CacheWrapper } from '../../index.js';
import type { OcpiModuleDependencies } from '../../dependencies.js';
import type { ILogObj, Logger } from 'tslog';

export { TokensModuleApi } from './module/TokensModuleApi.js';
export type { ITokensModuleApi } from './module/ITokensModuleApi.js';

export class TokensModule implements OcpiModule {
  readonly cacheWrapper: CacheWrapper;
  readonly logger: Logger<ILogObj>;

  constructor({ cacheWrapper, logger }: OcpiModuleDependencies) {
    this.cacheWrapper = cacheWrapper;
    this.logger = logger;
  }

  getController(): any {
    return TokensModuleApi;
  }
}
