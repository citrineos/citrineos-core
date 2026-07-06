// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { OcpiConfig } from '../../index.js';
import { CacheWrapper, OcpiConfigToken, OcpiModule } from '../../index.js';

import { CredentialsModuleApi } from './module/CredentialsModuleApi.js';
import { Inject, Service } from 'typedi';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export { CredentialsModuleApi } from './module/CredentialsModuleApi.js';
export type { ICredentialsModuleApi } from './module/ICredentialsModuleApi.js';

@Service()
export class CredentialsModule implements OcpiModule {
  constructor(
    @Inject(OcpiConfigToken) readonly config: OcpiConfig,
    readonly cacheWrapper: CacheWrapper,
    readonly logger?: Logger<ILogObj>,
  ) {}

  getController(): any {
    return CredentialsModuleApi;
  }
}
