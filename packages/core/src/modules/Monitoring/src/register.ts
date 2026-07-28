// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import { MonitoringService } from './module/MonitoringService.js';
import { DeviceModelService } from './module/services.js';
import {
  AbstractHandler,
  type BootstrapConfig,
  getHandlersByConfig,
  type SystemConfig,
} from '@citrineos/base';

/**
 * Registers the Monitoring module's internal services as scoped dependencies.
 * The service classes stay private to this package — only this registrar is exported.
 */
export function registerMonitoringServices(container: AwilixContainer): void {
  container.register({
    monitoringDeviceModelService: asClass(DeviceModelService).scoped(),
    monitoringService: asClass(MonitoringService).scoped(),
    monitoringHandlers: asFunction(
      (
        cradle: { config: BootstrapConfig & SystemConfig } & Record<string, unknown>,
      ): AbstractHandler[] =>
        getHandlersByConfig(
          cradle,
          cradle.config.modules.monitoring?.requests ?? [],
          cradle.config.modules.monitoring?.responses ?? [],
        ),
    ),
  });
}
