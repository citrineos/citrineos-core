// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ChargingProfilesModuleApi } from './module/ChargingProfilesModuleApi.js';
import { OcpiModule } from '../../index.js';
import type { CacheWrapper } from '../../index.js';
import type { OcpiModuleDependencies } from '../../dependencies.js';
import type { ILogObj, Logger } from 'tslog';

export class ChargingProfilesModule implements OcpiModule {
  readonly cacheWrapper: CacheWrapper;
  readonly logger: Logger<ILogObj>;

  constructor({ cacheWrapper, logger }: OcpiModuleDependencies) {
    this.cacheWrapper = cacheWrapper;
    this.logger = logger;
  }

  getController(): any {
    return ChargingProfilesModuleApi;
  }
}
