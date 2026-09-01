// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import {
  type AbstractHandler,
  buildHandlers,
  type HandlerClass,
  type HandlerResolverCradle,
} from '@citrineos/base';
import {
  AuthorizeRequestOcpp16Handler,
  AuthorizeRequestOcpp201Handler,
  AuthorizeRequestOcpp21Handler,
  CancelReservationResponseOcpp2Handler,
  ClearCacheResponseOcpp16Handler,
  ClearCacheResponseOcpp2Handler,
  GetLocalListVersionResponseOcpp16Handler,
  GetLocalListVersionResponseOcpp2Handler,
  NotifyWebPaymentStartedResponseOcpp21Handler,
  RemoteStartTransactionResponseOcpp16Handler,
  RemoteStopTransactionResponseOcpp16Handler,
  RequestStartTransactionResponseOcpp2Handler,
  RequestStopTransactionResponseOcpp2Handler,
  ReservationStatusUpdateRequestOcpp2Handler,
  ReserveNowResponseOcpp2Handler,
  SendLocalListResponseOcpp16Handler,
  SendLocalListResponseOcpp2Handler,
  UnlockConnectorResponseOcpp2Handler,
  VatNumberValidationRequestOcpp21Handler,
} from '@handlers/index.js';
import { ViesVatProvider } from '@/services/index.js';
import { LocalAuthListService } from './LocalAuthListService.js';

/**
 * The handlers this module owns. This list is what the module subscribes to — each handler declares
 * the actions and protocols it serves on itself, and config can only exclude from that.
 */
const EVDRIVER_HANDLERS = [
  AuthorizeRequestOcpp16Handler,
  AuthorizeRequestOcpp201Handler,
  AuthorizeRequestOcpp21Handler,
  ReservationStatusUpdateRequestOcpp2Handler,
  VatNumberValidationRequestOcpp21Handler,
  CancelReservationResponseOcpp2Handler,
  ClearCacheResponseOcpp16Handler,
  ClearCacheResponseOcpp2Handler,
  GetLocalListVersionResponseOcpp16Handler,
  GetLocalListVersionResponseOcpp2Handler,
  NotifyWebPaymentStartedResponseOcpp21Handler,
  RemoteStartTransactionResponseOcpp16Handler,
  RemoteStopTransactionResponseOcpp16Handler,
  RequestStartTransactionResponseOcpp2Handler,
  RequestStopTransactionResponseOcpp2Handler,
  ReserveNowResponseOcpp2Handler,
  SendLocalListResponseOcpp16Handler,
  SendLocalListResponseOcpp2Handler,
  UnlockConnectorResponseOcpp2Handler,
] satisfies ReadonlyArray<HandlerClass>;

/**
 * Registers the EVDriver module's internal services as scoped dependencies.
 * The service classes stay private to this package — only this registrar is exported.
 */
export function registerEVDriverServices(container: AwilixContainer): void {
  container.register({
    localAuthListService: asClass(LocalAuthListService).scoped(),
    viesVatProvider: asClass(ViesVatProvider).scoped(),
    evDriverHandlers: asFunction((cradle: HandlerResolverCradle): AbstractHandler[] =>
      buildHandlers(cradle.moduleScope, EVDRIVER_HANDLERS),
    ).scoped(),
  });
}
