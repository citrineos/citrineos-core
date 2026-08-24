// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * A correlated response never inherits its CALL's action, so no CALLRESULT or CALLERROR
 * row in OCPPMessages carries one.
 *
 * A response frame has no action to parse, so the router stores the NO_ACTION sentinel
 * for every one of them (`router.ts`: `parsedMessage.messageTypeId === MessageTypeId.Call
 * ? (parsedMessage as Call).action : NO_ACTION`). Filling that in is exactly what the
 * correlation triggers are for, but they do it with
 *
 *   NEW."action" := COALESCE(NEW."action", v_call_action)
 *
 * and COALESCE only replaces NULL. 'NoAction' is not NULL, so the CALL's action is never
 * written and every response keeps the sentinel.
 *
 * Anything that finds a response by action therefore misses it. A vendor DataTransfer
 * read-back that polls OCPPMessages for `action = 'DataTransfer'` waits for a row that is
 * present but stamped 'NoAction', and gives up.
 *
 * NULLIF makes the sentinel behave like the NULL it stands for, in both directions --
 * the response-arrives-first trigger and its mirror image. Existing rows are repaired
 * from the CALL they are already correlated to.
 *
 * The sentinel is spelled out rather than imported from @citrineos/types: a migration
 * records what the schema did at a point in time and must not change behaviour if that
 * constant is ever renamed.
 *
 * @type {import('sequelize-cli').Migration}
 */
const NO_ACTION = 'NoAction';

const responseFn = (actionExpr: string) => `
  CREATE OR REPLACE FUNCTION ocpp_correlate_response() RETURNS trigger AS $$
    DECLARE
      v_call_id     INTEGER;
      v_call_action VARCHAR;
    BEGIN
      PERFORM ocpp_lock_correlation_key(
        NEW."tenantId", NEW."ocppConnectionName", NEW."correlationId"
      );

      SELECT c.id, c."action" INTO v_call_id, v_call_action
        FROM "OCPPMessages" c
       WHERE c."tenantId" = NEW."tenantId"
         AND c."ocppConnectionName" = NEW."ocppConnectionName"
         AND c."correlationId" = NEW."correlationId"
         AND c."type" = 2
         AND NOT EXISTS (
               SELECT 1 FROM "OCPPMessages" r WHERE r."requestMessageId" = c.id
             )
       ORDER BY c."createdAt" DESC, c.id DESC
       LIMIT 1
         FOR UPDATE OF c;

      IF FOUND THEN
        NEW."requestMessageId" := v_call_id;
        NEW."action" := ${actionExpr};
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`;

const callFn = (actionExpr: string) => `
  CREATE OR REPLACE FUNCTION ocpp_correlate_call() RETURNS trigger AS $$
    DECLARE
      v_resp_id INTEGER;
    BEGIN
      PERFORM ocpp_lock_correlation_key(
        NEW."tenantId", NEW."ocppConnectionName", NEW."correlationId"
      );

      SELECT id INTO v_resp_id
        FROM "OCPPMessages"
       WHERE "tenantId" = NEW."tenantId"
         AND "ocppConnectionName" = NEW."ocppConnectionName"
         AND "correlationId" = NEW."correlationId"
         AND "type" IN (3, 4)
         AND "requestMessageId" IS NULL
         AND id <> NEW.id
       ORDER BY "createdAt" ASC, id ASC
       LIMIT 1
         FOR UPDATE;

      IF FOUND THEN
        UPDATE "OCPPMessages"
           SET "requestMessageId" = NEW.id,
               "action" = ${actionExpr}
         WHERE id = v_resp_id;
      END IF;

      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;`;

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        responseFn(`COALESCE(NULLIF(NEW."action", '${NO_ACTION}'), v_call_action)`),
        { transaction, type: QueryTypes.RAW },
      );
      await queryInterface.sequelize.query(
        callFn(`COALESCE(NULLIF("action", '${NO_ACTION}'), NEW."action")`),
        { transaction, type: QueryTypes.RAW },
      );

      // Repair the rows already stored: a response that is correlated to a CALL can take
      // that CALL's action now.
      await queryInterface.sequelize.query(
        `UPDATE "OCPPMessages" r
            SET "action" = c."action"
           FROM "OCPPMessages" c
          WHERE r."requestMessageId" = c.id
            AND r."type" IN (3, 4)
            AND r."action" = :noAction
            AND c."action" IS NOT NULL
            AND c."action" <> :noAction`,
        { transaction, replacements: { noAction: NO_ACTION }, type: QueryTypes.UPDATE },
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(responseFn(`COALESCE(NEW."action", v_call_action)`), {
        transaction,
        type: QueryTypes.RAW,
      });
      await queryInterface.sequelize.query(callFn(`COALESCE("action", NEW."action")`), {
        transaction,
        type: QueryTypes.RAW,
      });
    });
  },
};
