// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import { OCPP_CallAction } from '@citrineos/base';
import { SignedMeterValuesUtil } from '@util/security/SignedMeterValuesUtil.js';
import { CostCalculator } from './module/CostCalculator.js';
import { CostNotifier, type CostUpdatedNotifier } from './module/CostNotifier.js';
import { StatusNotificationService } from './module/StatusNotificationService.js';
import { TransactionService } from './module/TransactionService.js';
import type { TransactionsModule } from './module/module.js';

/**
 * Registers the Transactions module's internal services as scoped dependencies.
 */
export function registerTransactionsServices(container: AwilixContainer): void {
  container.register({
    transactionService: asClass(TransactionService).scoped(),
    statusNotificationService: asClass(StatusNotificationService).scoped(),
    costCalculator: asClass(CostCalculator).scoped(),
    costNotifier: asClass(CostNotifier).scoped(),
    signedMeterValuesUtil: asClass(SignedMeterValuesUtil).scoped(),
    // Breaks the former CostNotifier→module cycle: this closure reads `transactionsModule`
    // only when invoked at runtime (deferred), so there is no construction-time resolution
    // cycle. The param annotation keeps `sendCall` fully type-checked.
    costUpdatedNotifier: asFunction(
      (deps: { transactionsModule: TransactionsModule }): CostUpdatedNotifier =>
        async ({ ocppConnectionName, tenantId, totalCost, transactionId, protocol }) => {
          await deps.transactionsModule.sendCall(
            ocppConnectionName,
            tenantId,
            protocol,
            OCPP_CallAction.CostUpdated,
            { totalCost, transactionId },
          );
        },
    ).scoped(),
  });
}
