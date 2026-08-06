// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Splits ocpp_correlate_message() into two triggers, one per RPC role.
 *
 * The original ran entirely BEFORE INSERT. That is correct for a CALLRESULT/CALLERROR, which only
 * assigns to NEW, but not for a CALL: its branch back-fills an already-stored response with
 * "requestMessageId" = NEW.id, and BEFORE INSERT means that row does not exist yet. Postgres checks
 * OCPPMessages_requestMessageId_fkey at the end of that UPDATE, so every CALL arriving after its own
 * response raised SequelizeForeignKeyConstraintError and killed the dispatcher.
 *
 * So the CALL side moves to AFTER INSERT, where NEW.id is a real row and the foreign key holds. The
 * response side stays BEFORE INSERT because it must mutate NEW for Postgres' RETURNING clause — that
 * is how `createOCPPMessage(...)` still resolves to a record with `action` populated.
 *
 * Correlation is unchanged otherwise: the same transaction-scoped advisory lock serializes both
 * halves, so a CALL and its response can never run their lookups concurrently and both come up
 * empty. Taking the lock after the CALL row is inserted rather than before is safe — the lock is
 * still held for the rest of the transaction, and a response that gets there first blocks until the
 * CALL commits, at which point the CALL's own trigger finds it sitting unlinked and claims it.
 *
 * @type {import('sequelize-cli').Migration}
 */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS "trg_ocpp_correlate" ON "OCPPMessages"`,
        { transaction, type: QueryTypes.RAW },
      );
      await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS ocpp_correlate_message()`, {
        transaction,
        type: QueryTypes.RAW,
      });

      // Serializes inserts sharing a correlation key. Transaction-scoped: released when the
      // inserting transaction ends, so nothing has to unlock it explicitly. COALESCE keeps the key
      // non-null — pg_advisory_xact_lock() is strict, and a null argument would skip locking
      // silently rather than fail.
      await queryInterface.sequelize.query(
        `CREATE OR REPLACE FUNCTION ocpp_lock_correlation_key(
           p_tenant_id INTEGER,
           p_connection_name VARCHAR,
           p_correlation_id VARCHAR
         ) RETURNS void AS $$
           BEGIN
             PERFORM pg_advisory_xact_lock(
               hashtextextended(
                 COALESCE(p_tenant_id::text, '') || ':' ||
                 COALESCE(p_connection_name, '') || ':' ||
                 COALESCE(p_correlation_id, ''),
                 0
               )
             );
           END;
         $$ LANGUAGE plpgsql;`,
        { transaction, type: QueryTypes.RAW },
      );

      // BEFORE INSERT: a CALLRESULT/CALLERROR attaches itself to the CALL it answers.
      await queryInterface.sequelize.query(
        `CREATE OR REPLACE FUNCTION ocpp_correlate_response() RETURNS trigger AS $$
           DECLARE
             v_call_id     INTEGER;
             v_call_action VARCHAR;
           BEGIN
             PERFORM ocpp_lock_correlation_key(
               NEW."tenantId", NEW."ocppConnectionName", NEW."correlationId"
             );

             -- Attach to a CALL nothing has claimed yet.
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

             RETURN NEW;
           END;
         $$ LANGUAGE plpgsql;`,
        { transaction, type: QueryTypes.RAW },
      );

      // AFTER INSERT: a CALL adopts the response that beat it into the table. The two inserts race
      // through separate dispatcher paths, so either order happens.
      await queryInterface.sequelize.query(
        `CREATE OR REPLACE FUNCTION ocpp_correlate_call() RETURNS trigger AS $$
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
                      "action" = COALESCE("action", NEW."action")
                WHERE id = v_resp_id;
             END IF;

             RETURN NULL;
           END;
         $$ LANGUAGE plpgsql;`,
        { transaction, type: QueryTypes.RAW },
      );

      // The WHEN clauses keep uncorrelatable rows — no correlation id, or a null type from a message
      // that could not be parsed far enough to have an RPC role — out of the functions entirely,
      // which matters on the highest-volume table in the system.
      await queryInterface.sequelize.query(
        `CREATE TRIGGER "trg_ocpp_correlate_response"
           BEFORE INSERT ON "OCPPMessages"
           FOR EACH ROW
           WHEN (
             NEW."correlationId" IS NOT NULL
             AND NEW."requestMessageId" IS NULL
             AND NEW."type" IN (3, 4)
           )
           EXECUTE FUNCTION ocpp_correlate_response()`,
        { transaction, type: QueryTypes.RAW },
      );
      await queryInterface.sequelize.query(
        `CREATE TRIGGER "trg_ocpp_correlate_call"
           AFTER INSERT ON "OCPPMessages"
           FOR EACH ROW
           WHEN (NEW."correlationId" IS NOT NULL AND NEW."type" = 2)
           EXECUTE FUNCTION ocpp_correlate_call()`,
        { transaction, type: QueryTypes.RAW },
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS "trg_ocpp_correlate_response" ON "OCPPMessages"`,
        { transaction, type: QueryTypes.RAW },
      );
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS "trg_ocpp_correlate_call" ON "OCPPMessages"`,
        { transaction, type: QueryTypes.RAW },
      );
      await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS ocpp_correlate_response()`, {
        transaction,
        type: QueryTypes.RAW,
      });
      await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS ocpp_correlate_call()`, {
        transaction,
        type: QueryTypes.RAW,
      });
      await queryInterface.sequelize.query(
        `DROP FUNCTION IF EXISTS ocpp_lock_correlation_key(INTEGER, VARCHAR, VARCHAR)`,
        { transaction, type: QueryTypes.RAW },
      );

      // Restores the single BEFORE INSERT trigger this migration replaced, foreign key violation
      // included — rolling back means going back to the previous schema, not to a fixed one.
      await queryInterface.sequelize.query(
        `CREATE OR REPLACE FUNCTION ocpp_correlate_message() RETURNS trigger AS $$
           DECLARE
             v_call_id     INTEGER;
             v_call_action VARCHAR;
             v_resp_id     INTEGER;
           BEGIN
             IF NEW."correlationId" IS NULL OR NEW."requestMessageId" IS NOT NULL THEN
               RETURN NEW;
             END IF;

             IF NEW."type" IS NULL OR NEW."type" NOT IN (2, 3, 4) THEN
               RETURN NEW;
             END IF;

             PERFORM pg_advisory_xact_lock(
               hashtextextended(
                 NEW."tenantId"::text || ':' || NEW."ocppConnectionName" || ':' || NEW."correlationId",
                 0
               )
             );

             IF NEW."type" = 2 THEN
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
                 UPDATE "OCPPMessages"
                    SET "requestMessageId" = NEW.id,
                        "action" = COALESCE("action", NEW."action")
                  WHERE id = v_resp_id;
               END IF;

             ELSE
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
                 NEW."action" := COALESCE(NEW."action", v_call_action);
               END IF;
             END IF;

             RETURN NEW;
           END;
         $$ LANGUAGE plpgsql;`,
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
};
