// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Restores the OCPI notification triggers that 20260818120000-partition-transactions left behind on
 * "Transactions_old" and "MeterValues_old" when it swapped in the partitioned tables. The trigger
 * functions belong to the OCPI migration set, so a trigger is only recreated where its function exists;
 * on a fresh install the OCPI migrations run later and create the triggers on the partitioned tables.
 *
 * Lives in the ocpp-server set so it always runs after the swap, whichever server migrates first.
 */

const TRIGGERS = [
  {
    table: 'Transactions',
    trigger: 'TransactionNotification',
    fn: 'TransactionNotify',
    events: 'INSERT OR UPDATE',
  },
  {
    table: 'MeterValues',
    trigger: 'MeterValueNotification',
    fn: 'MeterValueNotify',
    events: 'INSERT',
  },
];

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      for (const { table, trigger, fn, events } of TRIGGERS) {
        await q(`DO $do$
          BEGIN
            IF to_regprocedure('"${fn}"()') IS NOT NULL THEN
              CREATE OR REPLACE TRIGGER "${trigger}"
                AFTER ${events} ON "${table}"
                FOR EACH ROW EXECUTE FUNCTION "${fn}"();
            END IF;
          END $do$`);
      }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      for (const { table, trigger } of TRIGGERS) {
        await q(`DROP TRIGGER IF EXISTS "${trigger}" ON "${table}"`);
      }
    });
  },
};
