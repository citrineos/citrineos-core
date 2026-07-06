// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { OcpiConfig } from '../../index.js';
import { CacheWrapper, OcpiConfigToken, OcpiModule } from '../../index.js';
import { Inject, Service } from 'typedi';
import { VersionsModuleApi } from './module/VersionsModuleApi.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export { VersionsModuleApi } from './module/VersionsModuleApi.js';
export type { IVersionsModuleApi } from './module/IVersionsModuleApi.js';

@Service()
export class VersionsModule implements OcpiModule {
  constructor(
    @Inject(OcpiConfigToken) readonly config: OcpiConfig,
    readonly cacheWrapper: CacheWrapper,
    readonly logger?: Logger<ILogObj>,
  ) {}

  public getController(): any {
    return VersionsModuleApi;
  }
}
