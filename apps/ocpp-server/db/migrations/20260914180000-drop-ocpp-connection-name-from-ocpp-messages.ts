// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Drops the "ocppConnectionName" column from OCPPMessages, rekeying the correlation
 * triggers onto "stationId". Stays nullable until 20260914200000.
 */

const NAME_INDEX = 'ocpp_messages_ocpp_connection_name';
const STATION_INDEX = 'ocpp_messages_station_id';
const CORRELATION_LOOKUP = 'ocpp_messages_correlation_lookup';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      // ── 1. Rescue attribution for rows that still have a resolvable name ──────
      // Only touches rows with a null FK; the populate trigger filled the rest on
      // insert, so this should match very little on a healthy database.
      await q(`
        UPDATE "OCPPMessages" AS t
           SET "stationId" = cs."id"
          FROM "ChargingStations" AS cs
         WHERE t."stationId" IS NULL
           AND t."ocppConnectionName" = cs."ocppConnectionName"
           AND t."tenantId" = cs."tenantId"
      `);

      const [unattributed] = await queryInterface.sequelize.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM "OCPPMessages" WHERE "stationId" IS NULL`,
        { transaction, type: QueryTypes.SELECT },
      );
      const count = Number(unattributed?.count ?? 0);
      if (count > 0) {
        console.warn(
          `[20260914180000] OCPPMessages: ${count} row(s) have no resolvable station and ` +
            `will keep a null "stationId". They are retained, but lose their station ` +
            `attribution when "ocppConnectionName" is dropped.`,
        );
      }

      // ── 2. Rekey the correlation machinery onto the FK ────────────────────────
      // The lock helper's middle parameter changes from VARCHAR to INTEGER, which is
      // a new signature rather than a replacement — drop the old one explicitly.
      await q(`DROP FUNCTION IF EXISTS ocpp_lock_correlation_key(INTEGER, VARCHAR, VARCHAR)`);
      await q(`
        CREATE OR REPLACE FUNCTION ocpp_lock_correlation_key(
          p_tenant_id INTEGER,
          p_station_id INTEGER,
          p_correlation_id VARCHAR
        ) RETURNS void AS $$
          BEGIN
            PERFORM pg_advisory_xact_lock(
              hashtextextended(
                COALESCE(p_tenant_id::text, '') || ':' ||
                COALESCE(p_station_id::text, '') || ':' ||
                COALESCE(p_correlation_id, ''),
                0
              )
            );
          END;
        $$ LANGUAGE plpgsql`);

      // BEFORE INSERT: a CALLRESULT/CALLERROR attaches itself to the CALL it answers.
      await q(`
        CREATE OR REPLACE FUNCTION ocpp_correlate_response() RETURNS trigger AS $$
          DECLARE
            v_call_id     INTEGER;
            v_call_action VARCHAR;
          BEGIN
            PERFORM ocpp_lock_correlation_key(
              NEW."tenantId", NEW."stationId", NEW."correlationId"
            );

            -- Attach to a CALL nothing has claimed yet.
            SELECT c.id, c."action" INTO v_call_id, v_call_action
              FROM "OCPPMessages" c
             WHERE c."tenantId" = NEW."tenantId"
               AND c."stationId" = NEW."stationId"
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
        $$ LANGUAGE plpgsql`);

      // AFTER INSERT: a CALL adopts the response that beat it into the table. The two inserts race
      // through separate dispatcher paths, so either order happens.
      await q(`
        CREATE OR REPLACE FUNCTION ocpp_correlate_call() RETURNS trigger AS $$
          DECLARE
            v_resp_id INTEGER;
          BEGIN
            PERFORM ocpp_lock_correlation_key(
              NEW."tenantId", NEW."stationId", NEW."correlationId"
            );

            SELECT id INTO v_resp_id
              FROM "OCPPMessages"
             WHERE "tenantId" = NEW."tenantId"
               AND "stationId" = NEW."stationId"
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
        $$ LANGUAGE plpgsql`);

      // Recreate the triggers so the WHEN clauses also skip station-less rows, which
      // the `=` lookups above can never match.
      await q(`DROP TRIGGER IF EXISTS "trg_ocpp_correlate_response" ON "OCPPMessages"`);
      await q(`DROP TRIGGER IF EXISTS "trg_ocpp_correlate_call" ON "OCPPMessages"`);
      await q(`
        CREATE TRIGGER "trg_ocpp_correlate_response"
          BEFORE INSERT ON "OCPPMessages"
          FOR EACH ROW
          WHEN (
            NEW."correlationId" IS NOT NULL
            AND NEW."requestMessageId" IS NULL
            AND NEW."stationId" IS NOT NULL
            AND NEW."type" IN (3, 4)
          )
          EXECUTE FUNCTION ocpp_correlate_response()`);
      await q(`
        CREATE TRIGGER "trg_ocpp_correlate_call"
          AFTER INSERT ON "OCPPMessages"
          FOR EACH ROW
          WHEN (
            NEW."correlationId" IS NOT NULL
            AND NEW."stationId" IS NOT NULL
            AND NEW."type" = 2
          )
          EXECUTE FUNCTION ocpp_correlate_call()`);

      // ── 3. The name-backfill trigger reads the column that is about to go ─────
      await q(
        `DROP TRIGGER IF EXISTS "trigger_populate_ocppmessages_station_id" ON "OCPPMessages"`,
      );

      // ── 4. Move the indexes onto the FK ──────────────────────────────────────
      // Created on the partitioned parent, so Postgres clones them to every
      // partition, present and future.
      await q(`DROP INDEX IF EXISTS "${NAME_INDEX}"`);
      await q(`DROP INDEX IF EXISTS "${STATION_INDEX}"`);
      await q(`CREATE INDEX "${STATION_INDEX}" ON "OCPPMessages" ("stationId")`);
      await q(`DROP INDEX IF EXISTS "${CORRELATION_LOOKUP}"`);
      await q(`
        CREATE INDEX "${CORRELATION_LOOKUP}"
          ON "OCPPMessages" ("tenantId", "stationId", "correlationId")`);

      // ── 5. Drop the column. Metadata-only in Postgres, so no table rewrite. ──
      await q(`ALTER TABLE "OCPPMessages" DROP COLUMN IF EXISTS "ocppConnectionName"`);
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      await q(
        `ALTER TABLE "OCPPMessages" ADD COLUMN IF NOT EXISTS "ocppConnectionName" VARCHAR(255)`,
      );
      await q(`
        UPDATE "OCPPMessages" AS t
           SET "ocppConnectionName" = cs."ocppConnectionName"
          FROM "ChargingStations" AS cs
         WHERE t."stationId" = cs."id"
      `);

      // Indexes back onto the name.
      await q(`DROP INDEX IF EXISTS "${STATION_INDEX}"`);
      await q(`DROP INDEX IF EXISTS "${CORRELATION_LOOKUP}"`);
      await q(`CREATE INDEX "${NAME_INDEX}" ON "OCPPMessages" ("ocppConnectionName")`);
      await q(`
        CREATE INDEX "${CORRELATION_LOOKUP}"
          ON "OCPPMessages" ("tenantId", "ocppConnectionName", "correlationId")`);

      // Correlation machinery back onto the name.
      await q(`DROP FUNCTION IF EXISTS ocpp_lock_correlation_key(INTEGER, INTEGER, VARCHAR)`);
      await q(`
        CREATE OR REPLACE FUNCTION ocpp_lock_correlation_key(
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
        $$ LANGUAGE plpgsql`);
      await q(`
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
              NEW."action" := COALESCE(NEW."action", v_call_action);
            END IF;

            RETURN NEW;
          END;
        $$ LANGUAGE plpgsql`);
      await q(`
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
                     "action" = COALESCE("action", NEW."action")
               WHERE id = v_resp_id;
            END IF;

            RETURN NULL;
          END;
        $$ LANGUAGE plpgsql`);

      await q(`DROP TRIGGER IF EXISTS "trg_ocpp_correlate_response" ON "OCPPMessages"`);
      await q(`DROP TRIGGER IF EXISTS "trg_ocpp_correlate_call" ON "OCPPMessages"`);
      await q(`
        CREATE TRIGGER "trg_ocpp_correlate_response"
          BEFORE INSERT ON "OCPPMessages"
          FOR EACH ROW
          WHEN (
            NEW."correlationId" IS NOT NULL
            AND NEW."requestMessageId" IS NULL
            AND NEW."type" IN (3, 4)
          )
          EXECUTE FUNCTION ocpp_correlate_response()`);
      await q(`
        CREATE TRIGGER "trg_ocpp_correlate_call"
          AFTER INSERT ON "OCPPMessages"
          FOR EACH ROW
          WHEN (NEW."correlationId" IS NOT NULL AND NEW."type" = 2)
          EXECUTE FUNCTION ocpp_correlate_call()`);

      // Reinstate the name-backfill trigger. populate_station_id() is shared and
      // still present, since other relations continue to use it.
      await q(`
        CREATE TRIGGER "trigger_populate_ocppmessages_station_id"
          BEFORE INSERT OR UPDATE ON "OCPPMessages"
          FOR EACH ROW WHEN (NEW."stationId" IS NULL)
          EXECUTE FUNCTION populate_station_id()`);
    });
  },
};
