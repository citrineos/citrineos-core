// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CdrsModuleApi } from './module/CdrsModuleApi.js';
import type { OcpiConfig } from '../../index.js';
import { CacheWrapper, OcpiConfigToken, OcpiModule } from '../../index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Inject, Service } from 'typedi';

export { CdrsModuleApi } from './module/CdrsModuleApi.js';
export type { ICdrsModuleApi } from './module/ICdrsModuleApi.js';

// Cdr pushes are triggered by session updates in the Sessions module.
@Service()
export class CdrsModule implements OcpiModule {
  constructor(
    @Inject(OcpiConfigToken) config: OcpiConfig,
    readonly cache: CacheWrapper,
    readonly logger?: Logger<ILogObj>,
  ) {}

  getController(): any {
    return CdrsModuleApi;
  }
}
