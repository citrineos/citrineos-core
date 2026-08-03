// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Moves request/response correlation out of SequelizeOCPPMessageRepository and into the database.
 *
 * A BEFORE INSERT trigger links each CALLRESULT/CALLERROR (type 3/4) to the CALL (type 2) it
 * answers, via "requestMessageId", and copies the CALL's action onto the response. Because it
 * runs BEFORE INSERT, the values it sets on NEW come back through Postgres' RETURNING clause —
 * which is how `createOCPPMessage(...)` still resolves to a record with `action` populated.
 *
 * Messages that cannot be correlated (no correlation id, no type, an already-set requestMessageId,
 * or simply no counterpart on record yet) are inserted uncorrelated rather than rejected. There is
 * deliberately no exception handler: a block with one costs a subtransaction on every insert, and
 * the statements below have no expected failure mode worth paying that on the busiest table.
 *
 * @type {import('sequelize-cli').Migration}
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Both trigger lookups filter on this exact prefix; without it every insert would
      // sequentially scan OCPPMessages, which is the highest-volume table in the system.
      await queryInterface.sequelize.query(
        `CREATE INDEX IF NOT EXISTS "ocpp_messages_correlation_lookup"
           ON "OCPPMessages" ("tenantId", "ocppConnectionName", "correlationId")`,
        { transaction, type: QueryTypes.RAW },
      );

      await queryInterface.sequelize.query(
        `CREATE OR REPLACE FUNCTION ocpp_correlate_message() RETURNS trigger AS $$
           DECLARE
             v_call_id     INTEGER;
             v_call_action VARCHAR;
             v_resp_id     INTEGER;
           BEGIN
             -- Nothing to correlate on, or the caller already decided the link itself.
             IF NEW."correlationId" IS NULL OR NEW."requestMessageId" IS NOT NULL THEN
               RETURN NEW;
             END IF;

             -- Unparseable messages are stored with a null type; they have no RPC role to match.
             IF NEW."type" IS NULL OR NEW."type" NOT IN (2, 3, 4) THEN
               RETURN NEW;
             END IF;

             -- Serialize inserts sharing a correlation key so a CALL and its response can never
             -- run their lookups concurrently and both come up empty. Transaction-scoped: released
             -- when the inserting transaction ends, so nothing has to unlock it explicitly.
             PERFORM pg_advisory_xact_lock(
               hashtextextended(
                 NEW."tenantId"::text || ':' || NEW."ocppConnectionName" || ':' || NEW."correlationId",
                 0
               )
             );

             IF NEW."type" = 2 THEN
               -- Inserting a CALL. Its response may have been recorded first (the two inserts race
               -- through separate dispatcher paths), in which case it is sitting here unlinked.
               SELECT id INTO v_resp_id
                 FROM "OCPPMessages"
                WHERE "tenantId" = NEW."tenantId"
                  AND "ocppConnectionName" = NEW."ocppConnectionName"
                  AND "correlationId" = NEW."correlationId"
                  AND "type" IN (3, 4)
                  AND "requestMessageId" IS NULL
                ORDER BY "createdAt" ASC, id ASC
                LIMIT 1
                  FOR UPDATE;

               IF FOUND THEN
                 -- NEW.id is already populated: Postgres evaluates column defaults (the serial
                 -- nextval) before firing BEFORE INSERT row triggers.
                 UPDATE "OCPPMessages"
                    SET "requestMessageId" = NEW.id,
                        "action" = COALESCE("action", NEW."action")
                  WHERE id = v_resp_id;
               END IF;

             ELSE
               -- Inserting a CALLRESULT/CALLERROR: attach it to a CALL nothing has claimed yet.
               SELECT c.id, c."action" INTO v_call_id, v_call_action
                 FROM "OCPPMessages" c
                WHERE c."tenantId" = NEW."tenantId"
                  AND c."ocppConnectionName" = NEW."ocppConnectionName"
                  AND c."correlationId" = NEW."correlationId"
                  AND c."type" = 2
                  AND NOT EXISTS (
                        SELECT 1 FROM "OCPPMessages" r WHERE r."requestMessageId" = c.id
                      )
                -- Newest first: stations reuse correlation ids, and an old CALL that never got a
                -- response stays unclaimed forever. Oldest-first would let that stale CALL swallow
                -- this response and stamp it with the wrong action.
                ORDER BY c."createdAt" DESC, c.id DESC
                LIMIT 1
                  FOR UPDATE OF c;

               IF FOUND THEN
                 NEW."requestMessageId" := v_call_id;
                 NEW."action" := COALESCE(NEW."action", v_call_action);
               END IF;
             END IF;

             RETURN NEW;
           END;
         $$ LANGUAGE plpgsql;`,
        { transaction, type: QueryTypes.RAW },
      );

      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS "trg_ocpp_correlate" ON "OCPPMessages"`,
        { transaction, type: QueryTypes.RAW },
      );
      await queryInterface.sequelize.query(
        `CREATE TRIGGER "trg_ocpp_correlate"
           BEFORE INSERT ON "OCPPMessages"
           FOR EACH ROW EXECUTE FUNCTION ocpp_correlate_message()`,
        { transaction, type: QueryTypes.RAW },
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS "trg_ocpp_correlate" ON "OCPPMessages"`,
        { transaction, type: QueryTypes.RAW },
      );
      await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS ocpp_correlate_message()`, {
        transaction,
        type: QueryTypes.RAW,
      });
      await queryInterface.sequelize.query(
        `DROP INDEX IF EXISTS "ocpp_messages_correlation_lookup"`,
        { transaction, type: QueryTypes.RAW },
      );
    });
  },
};
