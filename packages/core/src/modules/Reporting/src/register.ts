// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import { DeviceModelService } from './module/services.js';
import {
  AbstractHandler,
  type BootstrapConfig,
  getHandlersByConfig,
  type SystemConfig,
} from '@citrineos/base';

/**
 * Registers the Reporting module's internal services as scoped dependencies.
 * The service classes stay private to this package — only this registrar is exported.
 */
export function registerReportingServices(container: AwilixContainer): void {
  container.register({
    reportingDeviceModelService: asClass(DeviceModelService).scoped(),
    reportingHandlers: asFunction(
      (
        cradle: { config: BootstrapConfig & SystemConfig } & Record<string, unknown>,
      ): AbstractHandler[] =>
        getHandlersByConfig(
          cradle,
          cradle.config.modules.reporting?.requests ?? [],
          cradle.config.modules.reporting?.responses ?? [],
        ),
    ).scoped(),
  });
}
