// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
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
  ClearChargingProfileResponseOcpp16Handler,
  ClearChargingProfileResponseOcpp2Handler,
  ClearedChargingLimitRequestOcpp2Handler,
  GetChargingProfilesResponseOcpp2Handler,
  GetCompositeScheduleResponseOcpp16Handler,
  GetCompositeScheduleResponseOcpp201Handler,
  NotifyChargingLimitRequestOcpp2Handler,
  NotifyEVChargingNeedsRequestOcpp2Handler,
  NotifyEVChargingScheduleRequestOcpp2Handler,
  ReportChargingProfilesRequestOcpp2Handler,
  SetChargingProfileResponseOcpp16Handler,
  SetChargingProfileResponseOcpp2Handler,
} from '@handlers/index.js';

/**
 * The handlers this module owns. Which of them are built is decided by the module's configured
 * requests/responses; the actions each one serves are declared on the handler class itself.
 */
const SMART_CHARGING_HANDLERS = [
  NotifyEVChargingNeedsRequestOcpp2Handler,
  NotifyEVChargingScheduleRequestOcpp2Handler,
  NotifyChargingLimitRequestOcpp2Handler,
  ReportChargingProfilesRequestOcpp2Handler,
  ClearedChargingLimitRequestOcpp2Handler,
  ClearChargingProfileResponseOcpp2Handler,
  GetChargingProfilesResponseOcpp2Handler,
  SetChargingProfileResponseOcpp2Handler,
  GetCompositeScheduleResponseOcpp201Handler,
  SetChargingProfileResponseOcpp16Handler,
  ClearChargingProfileResponseOcpp16Handler,
  GetCompositeScheduleResponseOcpp16Handler,
] satisfies ReadonlyArray<HandlerClass>;

/**
 * Registers the SmartCharging module's internal services as scoped dependencies.
 * The service classes stay private to this package — only this registrar is exported.
 */
export function registerSmartChargingServices(container: AwilixContainer): void {
  container.register({
    smartChargingHandlers: asFunction((cradle: HandlerResolverCradle): AbstractHandler[] =>
      buildHandlers(cradle.moduleScope, SMART_CHARGING_HANDLERS),
    ).scoped(),
  });
}
