// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, type AwilixContainer } from 'awilix';
import { MonitoringService } from './module/MonitoringService.js';
import { DeviceModelService } from './module/services.js';

/**
 * Registers the Monitoring module's internal services as scoped dependencies.
 * The service classes stay private to this package — only this registrar is exported.
 */
export function registerMonitoringServices(container: AwilixContainer): void {
  container.register({
    monitoringDeviceModelService: asClass(DeviceModelService).scoped(),
    monitoringService: asClass(MonitoringService).scoped(),
  });
}
