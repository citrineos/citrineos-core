// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asFunction, type AwilixContainer } from 'awilix';
import {
  type AbstractHandler,
  buildHandlers,
  type HandlerClass,
  type HandlerResolverCradle,
} from '@citrineos/base';
import {
  CustomerInformationResponseOcpp2Handler,
  DiagnosticsStatusNotificationRequestOcpp16Handler,
  GetBaseReportResponseOcpp2Handler,
  GetDiagnosticsResponseOcpp16Handler,
  GetLogResponseOcpp2Handler,
  GetMonitoringReportResponseOcpp2Handler,
  GetReportResponseOcpp2Handler,
  LogStatusNotificationRequestOcpp2Handler,
  NotifyCustomerInformationRequestOcpp2Handler,
  NotifyMonitoringReportRequestOcpp2Handler,
  NotifyReportRequestOcpp2Handler,
  SecurityEventNotificationRequestOcpp2Handler,
} from '@handlers/index.js';

/**
 * The handlers this module owns. This list is what the module subscribes to — each handler declares
 * the actions and protocols it serves on itself, and config can only exclude from that.
 *
 * GetMonitoringReportResponseOcpp2Handler is deliberately listed here as well as in the Monitoring
 * module: both modules' configs claimed that response before subscriptions were derived, so both keep
 * their own instance. Worth settling which module should own it.
 */
const REPORTING_HANDLERS = [
  DiagnosticsStatusNotificationRequestOcpp16Handler,
  LogStatusNotificationRequestOcpp2Handler,
  NotifyCustomerInformationRequestOcpp2Handler,
  NotifyMonitoringReportRequestOcpp2Handler,
  NotifyReportRequestOcpp2Handler,
  SecurityEventNotificationRequestOcpp2Handler,
  CustomerInformationResponseOcpp2Handler,
  GetBaseReportResponseOcpp2Handler,
  GetDiagnosticsResponseOcpp16Handler,
  GetLogResponseOcpp2Handler,
  GetMonitoringReportResponseOcpp2Handler,
  GetReportResponseOcpp2Handler,
] satisfies ReadonlyArray<HandlerClass>;

/**
 * Registers the Reporting module's internal services as scoped dependencies.
 * The service classes stay private to this package — only this registrar is exported.
 */
export function registerReportingServices(container: AwilixContainer): void {
  container.register({
    reportingHandlers: asFunction((cradle: HandlerResolverCradle): AbstractHandler[] =>
      buildHandlers(cradle.moduleScope, REPORTING_HANDLERS),
    ).scoped(),
  });
}
