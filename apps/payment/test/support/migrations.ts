// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import createPaymentTables from '../../db/migrations/20261023160459-create-payment-tables.js';

/** This app's migrations, oldest first, as sequelize-cli runs them. */
export const PAYMENT_MIGRATIONS = [createPaymentTables];
