// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import {
  type AbstractHandler,
  buildHandlers,
  type HandlerClass,
  type HandlerResolverCradle,
} from '@citrineos/base';
import { DefaultPriceCaliforniaPricingOcpp16Handler } from './handlers/default-price-ocpp-16-handler.js';
import { FinalCostCaliforniaPricingOcpp16Handler } from './handlers/final-cost-ocpp-16-handler.js';
import { RunningCostCaliforniaPricingOcpp16Handler } from './handlers/running-cost-ocpp-16-handler.js';
import { CustomDisplayCostAndPriceOcpp16Handler } from './handlers/custom-display-cost-and-price-16-handler.js';
import { CaliforniaPricingService } from './california-pricing-service.js';

/**
 * The observer handlers this module owns. They live here rather than in the shared handler tree
 * because they serve a vendor customization (org.openchargealliance.costmsg), not an OCPP action.
 * Each subscribes to an action already handled elsewhere; because this module has its own
 * EventGroup queue, it receives its own copy and never sends the OCPP response for these actions.
 *
 * SetUserPriceCaliforniaPricingOcpp16Handler is deliberately absent: cost calculation does not
 * take the Authorization TariffId into account, so there is no driver-specific price to send yet.
 * Add it here once user-specific pricing is supported, otherwise it would subscribe this module's
 * queue to every Authorize for no effect.
 */
const CALIFORNIA_PRICING_HANDLERS = [
  DefaultPriceCaliforniaPricingOcpp16Handler,
  RunningCostCaliforniaPricingOcpp16Handler,
  FinalCostCaliforniaPricingOcpp16Handler,
  CustomDisplayCostAndPriceOcpp16Handler,
] satisfies ReadonlyArray<HandlerClass>;

/**
 * Registers the CaliforniaPricing module's internal services as scoped dependencies.
 * The service classes stay private to this package — only this registrar is exported.
 */
export function registerCaliforniaPricingServices(container: AwilixContainer): void {
  container.register({
    californiaPricingService: asClass(CaliforniaPricingService).scoped(),
    californiaPricingHandlers: asFunction((cradle: HandlerResolverCradle): AbstractHandler[] =>
      buildHandlers(cradle.moduleScope, CALIFORNIA_PRICING_HANDLERS),
    ).scoped(),
  });
}
