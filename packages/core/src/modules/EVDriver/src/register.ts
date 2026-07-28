// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import {
  type AbstractHandler,
  type BootstrapConfig,
  getHandlersByConfig,
  type SystemConfig,
} from '@citrineos/base';
import { ViesVatProvider } from '@util/index.js';
import { LocalAuthListService } from './module/LocalAuthListService.js';

/**
 * Registers the EVDriver module's internal services as scoped dependencies.
 * The service classes stay private to this package — only this registrar is exported.
 */
export function registerEVDriverServices(container: AwilixContainer): void {
  container.register({
    localAuthListService: asClass(LocalAuthListService).scoped(),
    viesVatProvider: asClass(ViesVatProvider).scoped(),
    evDriverHandlers: asFunction(
      (
        cradle: { config: BootstrapConfig & SystemConfig } & Record<string, unknown>,
      ): AbstractHandler[] =>
        getHandlersByConfig(
          cradle,
          cradle.config.modules.evdriver.requests,
          cradle.config.modules.evdriver.responses,
        ),
    ).scoped(),
  });
}
