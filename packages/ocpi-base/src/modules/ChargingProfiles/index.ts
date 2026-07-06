// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ChargingProfilesModuleApi } from './module/ChargingProfilesModuleApi.js';
import type { OcpiConfig } from '../../index.js';
import { CacheWrapper, OcpiConfigToken, OcpiModule } from '../../index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { Container, Inject, Service } from 'typedi';
import { useContainer } from 'routing-controllers';

useContainer(Container);

@Service()
export class ChargingProfilesModule implements OcpiModule {
  constructor(
    @Inject(OcpiConfigToken) config: OcpiConfig,
    readonly cache: CacheWrapper,
    readonly logger?: Logger<ILogObj>,
  ) {}

  getController(): any {
    return ChargingProfilesModuleApi;
  }
}
