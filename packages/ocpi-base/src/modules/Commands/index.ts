// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Service } from 'typedi';

import { CommandsModuleApi } from './module/CommandsModuleApi.js';
import type { OcpiConfig } from '../../index.js';
import { CacheWrapper, OcpiConfigToken, OcpiModule } from '../../index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

export { CommandsModuleApi } from './module/CommandsModuleApi.js';
export type { ICommandsModuleApi } from './module/ICommandsModuleApi.js';

@Service()
export class CommandsModule implements OcpiModule {
  constructor(
    @Inject(OcpiConfigToken) readonly config: OcpiConfig,
    readonly cacheWrapper: CacheWrapper,
    readonly logger?: Logger<ILogObj>,
  ) {}

  getController(): any {
    return CommandsModuleApi;
  }
}
