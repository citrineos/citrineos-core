// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import { MonitoringService } from './module/MonitoringService.js';
import { DeviceModelService } from './module/services.js';
import {
  type AbstractHandler,
  buildHandlers,
  type HandlerClass,
  type HandlerResolverCradle,
} from '@citrineos/base';
import {
  ClearVariableMonitoringResponseOcpp2Handler,
  GetMonitoringReportResponseOcpp2Handler,
  GetVariablesResponseOcpp2Handler,
  NotifyEventRequestOcpp2Handler,
  SetMonitoringBaseResponseOcpp2Handler,
  SetMonitoringLevelResponseOcpp2Handler,
  SetVariableMonitoringResponseOcpp2Handler,
  SetVariablesResponseOcpp2Handler,
} from '@handlers/index.js';

/**
 * The handlers this module owns. Which of them are built is decided by the module's configured
 * requests/responses; the actions each one serves are declared on the handler class itself.
 */
const MONITORING_HANDLERS = [
  NotifyEventRequestOcpp2Handler,
  ClearVariableMonitoringResponseOcpp2Handler,
  GetMonitoringReportResponseOcpp2Handler,
  GetVariablesResponseOcpp2Handler,
  SetMonitoringBaseResponseOcpp2Handler,
  SetMonitoringLevelResponseOcpp2Handler,
  SetVariableMonitoringResponseOcpp2Handler,
  SetVariablesResponseOcpp2Handler,
] satisfies ReadonlyArray<HandlerClass>;

/**
 * Registers the Monitoring module's internal services as scoped dependencies.
 * The service classes stay private to this package — only this registrar is exported.
 */
export function registerMonitoringServices(container: AwilixContainer): void {
  container.register({
    monitoringDeviceModelService: asClass(DeviceModelService).scoped(),
    monitoringService: asClass(MonitoringService).scoped(),
    monitoringHandlers: asFunction((cradle: HandlerResolverCradle): AbstractHandler[] =>
      buildHandlers(cradle.moduleScope, MONITORING_HANDLERS),
    ).scoped(),
  });
}
