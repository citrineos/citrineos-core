// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Sequelize } from '@citrineos/dal';
import type { IPaymentAccountRepository } from '../repositories/index.js';
import type { MigrationPlan } from './types.js';
import { AccountAction } from './types.js';

/** Thrown while sessions the Python service has to settle are still charging. */
export class OpenPythonCheckoutsError extends Error {
  constructor(readonly checkoutIds: number[]) {
    super(
      `The Python service still has ${checkoutIds.length} paid session(s) charging (checkouts ` +
        `${checkoutIds.join(', ')}); let them finish there first`,
    );
  }
}

export interface ApplyOptions {
  scanAndChargeEnabled: boolean;
  /** Applies even while the Python service has sessions charging, e.g. ones a person will settle. */
  ignoreOpenPythonCheckouts?: boolean;
}

export interface ApplyResult {
  accountsCreated: number;
  checkoutSequenceSetTo: number | null;
}

/**
 * Makes the plan's changes to this app's own tables: the payment accounts it could decide, and
 * the checkout id sequence. Core's data is left alone; the report says what to change there.
 * Refuses while sessions the Python service took payment for are still charging: it captures them
 * when they end, and once tenants take payments here it is on its way out.
 */
export async function applyPlan(
  plan: MigrationPlan,
  sequelize: Sequelize,
  accounts: IPaymentAccountRepository,
  options: ApplyOptions,
): Promise<ApplyResult> {
  const running = plan.pythonSessions.running;
  if (running.length && !options.ignoreOpenPythonCheckouts) {
    throw new OpenPythonCheckoutsError(running.map((session) => session.checkoutId));
  }
  let accountsCreated = 0;
  for (const account of plan.accounts.filter(
    (candidate) => candidate.action === AccountAction.Create,
  )) {
    await accounts.create(account.tenantId, {
      stripeAccountId: account.stripeAccountId,
      scanAndChargeEnabled: options.scanAndChargeEnabled,
    });
    accountsCreated++;
  }
  if (plan.checkoutSequence) {
    // Only ever moved forward: GREATEST keeps a sequence that has moved on since the plan.
    await sequelize.query(
      `SELECT setval('"Checkouts_id_seq"',
         GREATEST(:next, (SELECT CASE WHEN is_called THEN last_value + 1 ELSE last_value END
                            FROM "Checkouts_id_seq")), false)`,
      { replacements: { next: plan.checkoutSequence.next } },
    );
  }
  return { accountsCreated, checkoutSequenceSetTo: plan.checkoutSequence?.next ?? null };
}
