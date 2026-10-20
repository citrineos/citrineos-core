// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * "AuthorizationAttempts", range partitioned on "createdAt" with one partition per ISO week, the
 * same way as "WebsocketEvents".
 * @type {import('sequelize-cli').Migration}
 */

/** Partitions provisioned beyond the current week. */
const WEEKS_AHEAD = 1;
/** Weeks `rotate_authorization_attempts_partitions` keeps, counting the current one, when not told. */
const DEFAULT_RETAIN_WEEKS = 12;

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const raw = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      // Partition bounds come from date_trunc(), which resolves against the session timezone.
      await raw(`SET LOCAL timezone = 'UTC'`);

      // A unique constraint on a partitioned table must contain the partition key, so the primary
      // key is (id, "createdAt") and nothing can reference this table by id alone. For the same
      // reason "transactionDatabaseId" has no foreign key: "Transactions" is partitioned too.
      await raw(`
        CREATE TABLE "AuthorizationAttempts" (
          id                      serial,
          "stationId"             integer REFERENCES "ChargingStations" (id)
                                    ON UPDATE CASCADE ON DELETE SET NULL,
          "ocppVersion"           varchar(255) NOT NULL,
          action                  varchar(255) NOT NULL,
          "correlationId"         varchar(255) NOT NULL,
          "timestamp"             timestamptz NOT NULL,
          "idToken"               varchar(255) NOT NULL,
          "idTokenType"           varchar(255),
          "authorizationId"       integer REFERENCES "Authorizations" (id)
                                    ON UPDATE CASCADE ON DELETE SET NULL,
          "storedStatus"          varchar(255),
          "responseStatus"        varchar(255),
          reason                  varchar(255) NOT NULL,
          details                 jsonb,
          "evseId"                integer,
          "connectorId"           integer,
          "transactionDatabaseId" integer,
          "transactionCreatedAt"  timestamptz,
          "transactionId"         varchar(255),
          "remoteStartId"         integer,
          "tenantId"              integer NOT NULL REFERENCES "Tenants" (id)
                                    ON UPDATE CASCADE ON DELETE RESTRICT,
          "createdAt"             timestamptz NOT NULL,
          "updatedAt"             timestamptz NOT NULL,
          PRIMARY KEY (id, "createdAt")
        ) PARTITION BY RANGE ("createdAt")`);

      await raw(
        `CREATE INDEX "authorization_attempts_authorization_id_timestamp"
           ON "AuthorizationAttempts" ("authorizationId", "timestamp")`,
      );
      await raw(
        `CREATE INDEX "authorization_attempts_station_id_timestamp"
           ON "AuthorizationAttempts" ("stationId", "timestamp")`,
      );

      // The first partition is MINVALUE-bounded so a row stamped slightly before this week still
      // lands somewhere; there is no DEFAULT partition, so inserts FAIL past the last provisioned
      // week until provision-partitions.ts or the rotation procedure creates the next one.
      await raw(`DO $$
        DECLARE
          wk       date;
          is_first boolean := true;
        BEGIN
          FOR wk IN SELECT generate_series(
                      date_trunc('week', now())::date,
                      (date_trunc('week', now()) + make_interval(weeks => ${WEEKS_AHEAD}))::date,
                      interval '1 week')::date
          LOOP
            IF is_first THEN
              EXECUTE format(
                'CREATE TABLE %I PARTITION OF "AuthorizationAttempts" FOR VALUES FROM (MINVALUE) TO (%L)',
                'AuthorizationAttempts_' || to_char(wk, 'IYYY"w"IW'), (wk + 7)::timestamptz);
              is_first := false;
            ELSE
              EXECUTE format(
                'CREATE TABLE %I PARTITION OF "AuthorizationAttempts" FOR VALUES FROM (%L) TO (%L)',
                'AuthorizationAttempts_' || to_char(wk, 'IYYY"w"IW'), wk::timestamptz, (wk + 7)::timestamptz);
            END IF;
          END LOOP;
        END $$`);

      // Provisions the current week plus p_future_weeks, and drops weekly partitions older than
      // p_retain_weeks. The regex confines it to rotation-managed names. Not scheduled here:
      // provision-partitions.ts calls it provision-only on every start.
      await raw(`
        CREATE OR REPLACE PROCEDURE rotate_authorization_attempts_partitions(
          p_retain_weeks int     DEFAULT ${DEFAULT_RETAIN_WEEKS},
          p_future_weeks int     DEFAULT ${WEEKS_AHEAD},
          p_dry_run      boolean DEFAULT false
        ) LANGUAGE plpgsql AS $$
        DECLARE
          wk date; part text; cutoff date; rec record; part_week date;
        BEGIN
          FOR wk IN SELECT generate_series(
                      date_trunc('week', now())::date,
                      (date_trunc('week', now()) + make_interval(weeks => p_future_weeks))::date,
                      interval '1 week')::date
          LOOP
            part := 'AuthorizationAttempts_' || to_char(wk, 'IYYY"w"IW');
            IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part) THEN
              IF p_dry_run THEN
                RAISE NOTICE 'would create %', part;
              ELSE
                EXECUTE format(
                  'CREATE TABLE %I PARTITION OF "AuthorizationAttempts" FOR VALUES FROM (%L) TO (%L)',
                  part, wk::timestamptz, (wk + 7)::timestamptz);
                RAISE NOTICE 'created %', part;
              END IF;
            END IF;
          END LOOP;

          cutoff := (date_trunc('week', now()) - make_interval(weeks => p_retain_weeks - 1))::date;

          FOR rec IN
            SELECT c.relname FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
             WHERE i.inhparent = '"AuthorizationAttempts"'::regclass
               AND c.relname ~ '^AuthorizationAttempts_[0-9]{4}w[0-9]{2}$'
             ORDER BY c.relname
          LOOP
            part_week := to_date(right(rec.relname, 7), 'IYYY"w"IW');
            IF part_week < cutoff THEN
              IF p_dry_run THEN
                RAISE NOTICE 'would drop % (week of %)', rec.relname, part_week;
              ELSE
                EXECUTE format('DROP TABLE %I', rec.relname);
                RAISE NOTICE 'dropped % (week of %)', rec.relname, part_week;
              END IF;
            END IF;
          END LOOP;
        END $$`);
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const raw = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      await raw(
        `DROP PROCEDURE IF EXISTS rotate_authorization_attempts_partitions(int, int, boolean)`,
      );
      // Drops every partition with it.
      await raw(`DROP TABLE IF EXISTS "AuthorizationAttempts"`);
    });
  },
};
