// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TokensModuleApi } from './module/TokensModuleApi.js';
import type { OcpiConfig } from '../../index.js';
import { CacheWrapper, OcpiConfigToken, OcpiModule } from '../../index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Inject, Service } from 'typedi';

export { TokensModuleApi } from './module/TokensModuleApi.js';
export type { ITokensModuleApi } from './module/ITokensModuleApi.js';

@Service()
export class TokensModule implements OcpiModule {
  constructor(
    @Inject(OcpiConfigToken) config: OcpiConfig,
    readonly cacheWrapper: CacheWrapper,
    readonly logger?: Logger<ILogObj>,
  ) {}

  getController(): any {
    return TokensModuleApi;
  }
}
