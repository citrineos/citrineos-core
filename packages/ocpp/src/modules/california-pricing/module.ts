// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type AbstractHandler, type OcppModuleDependencies, AbstractModule } from '@citrineos/base';
import { EventGroup } from '@citrineos/types';

export interface CaliforniaPricingModuleDependencies extends OcppModuleDependencies {
  californiaPricingHandlers?: AbstractHandler[];
}

/**
 * Optional module implementing the OCA "OCPP & California Pricing Requirements" customization
 * (org.openchargealliance.costmsg) for OCPP 1.6. It observes Authorize/MeterValues/StopTransaction
 * and emits SetUserPrice/RunningCost/FinalCost DataTransfer messages, gated per station on the
 * CustomDisplayCostAndPrice configuration key.
 */
export class CaliforniaPricingModule extends AbstractModule {
  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    ocppSender,
    californiaPricingHandlers,
  }: CaliforniaPricingModuleDependencies) {
    super(
      config,
      cache,
      handler,
      sender,
      EventGroup.CaliforniaPricing,
      ocppSender,
      logger,
      ocppValidator,
      californiaPricingHandlers,
    );
  }
}

export default CaliforniaPricingModule;
