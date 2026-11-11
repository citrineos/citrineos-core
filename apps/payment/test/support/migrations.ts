// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import createPaymentTables from '../../db/migrations/20261023160459-create-payment-tables.js';
import addPaymentAccountTermsUrl from '../../db/migrations/20261024090000-add-payment-account-terms-url.js';
import addCheckoutsStatusIndex from '../../db/migrations/20261027090000-add-checkouts-status-index.js';

/** This app's migrations, oldest first, as sequelize-cli runs them. */
export const PAYMENT_MIGRATIONS = [
  createPaymentTables,
  addPaymentAccountTermsUrl,
  addCheckoutsStatusIndex,
];
