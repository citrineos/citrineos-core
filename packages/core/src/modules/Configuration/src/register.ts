// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import { BootNotificationService } from './module/BootNotificationService.js';
import { DeviceModelService } from './module/DeviceModelService.js';

/**
 * Registers the Configuration module's internal services as scoped dependencies.
 * The service classes stay private to this package — only this registrar is exported.
 */
export function registerConfigurationServices(container: AwilixContainer): void {
  container.register({
    configurationDeviceModelService: asClass(DeviceModelService).scoped(),
    // BootNotificationService takes the narrowed module config, not the full `config` token.
    bootNotificationService: asFunction(
      ({ bootRepository, cache, config, logger }) =>
        new BootNotificationService({
          bootRepository,
          cache,
          config: config.modules.configuration,
          logger,
        }),
    ).scoped(),
  });
}
