// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * A bug previously allowed a CallResult or CallError to be correlated to a Call with no action, even if the Call had an action.
 * This migration repairs those rows by copying the action from the correlated Call into the CallResult or CallError.
 *
 * @type {import('sequelize-cli').Migration}
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      `UPDATE "OCPPMessages" r
            SET "action" = c."action"
           FROM "OCPPMessages" c
          WHERE r."requestMessageId" = c.id
            AND r."type" IN (3, 4)
            AND r."action" = :noAction
            AND c."action" IS NOT NULL
            AND c."action" <> :noAction`,
      { replacements: { noAction: 'NoAction' }, type: QueryTypes.UPDATE },
    );
  },

  down: async (_queryInterface: QueryInterface) => {},
};
