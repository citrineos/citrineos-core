// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface, QueryTypes } from 'sequelize';

/**
 * Monthly range partitions for Transactions and its five children, with a rolling
 * retention window. Children partition on "transactionCreatedAt" so they age out
 * together with the transaction they belong to.
 */

/** Months provisioned beyond the current one. */
const FUTURE_MONTHS = 2;

/**
 * Every month boundary uses the 3-argument date_trunc so it is UTC regardless of the
 * pooled connection's TimeZone. Autocommit statements can land on any connection, so
 * `SET timezone` is not dependable here.
 */
const CUTOFF = 'transactions_retention_cutoff()';

interface ChildSpec {
  /** Table name. */
  table: string;
  /** Column definitions for the partitioned parent, "transactionCreatedAt" last. */
  ddl: string;
  /** Explicit column list for the copy; never SELECT *. */
  columns: string;
  /** Outbound foreign keys, re-added after the copy. */
  fks: string;
}

const CHILDREN: ChildSpec[] = [
  {
    table: 'TransactionEvents',
    ddl: `
      id                      integer NOT NULL DEFAULT nextval('"TransactionEvents_id_seq"'),
      "ocppConnectionName"    varchar(255),
      "eventType"             varchar(255),
      "timestamp"             timestamptz,
      "triggerReason"         varchar(255),
      "seqNo"                 integer,
      offline                 boolean DEFAULT false,
      "numberOfPhasesUsed"    integer,
      "cableMaxCurrent"       numeric,
      "reservationId"         integer,
      "transactionInfo"       json,
      "createdAt"             timestamptz NOT NULL,
      "updatedAt"             timestamptz NOT NULL,
      "transactionDatabaseId" integer,
      "evseId"                integer,
      "tenantId"              integer NOT NULL DEFAULT 1,
      "idTokenValue"          varchar(255),
      "idTokenType"           varchar(255),
      "transactionCreatedAt"  timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (id, "transactionCreatedAt")`,
    columns: `id, "ocppConnectionName", "eventType", "timestamp", "triggerReason", "seqNo", offline,
      "numberOfPhasesUsed", "cableMaxCurrent", "reservationId", "transactionInfo",
      "createdAt", "updatedAt", "transactionDatabaseId", "evseId", "tenantId",
      "idTokenValue", "idTokenType", "transactionCreatedAt"`,
    fks: `
      ADD CONSTRAINT "TransactionEvents_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "Tenants"(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      ADD CONSTRAINT "TransactionEvents_evseTypeId_fkey" FOREIGN KEY ("evseId")
        REFERENCES "EvseTypes"("databaseId") ON UPDATE CASCADE ON DELETE SET NULL`,
  },
  {
    table: 'StartTransactions',
    ddl: `
      id                      integer NOT NULL DEFAULT nextval('"StartTransactions_id_seq"'),
      "ocppConnectionName"    varchar(255),
      "meterStart"            integer,
      "timestamp"             timestamptz,
      "reservationId"         integer,
      "transactionDatabaseId" integer,
      "createdAt"             timestamptz NOT NULL,
      "updatedAt"             timestamptz NOT NULL,
      "idTokenDatabaseId"     integer,
      "connectorDatabaseId"   integer,
      "tenantId"              integer NOT NULL DEFAULT 1,
      "transactionCreatedAt"  timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (id, "transactionCreatedAt"),
      CONSTRAINT "StartTransactions_transactionDatabaseId_key"
        UNIQUE ("transactionDatabaseId", "transactionCreatedAt")`,
    columns: `id, "ocppConnectionName", "meterStart", "timestamp", "reservationId",
      "transactionDatabaseId", "createdAt", "updatedAt", "idTokenDatabaseId",
      "connectorDatabaseId", "tenantId", "transactionCreatedAt"`,
    fks: `
      ADD CONSTRAINT "StartTransactions_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "Tenants"(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      ADD CONSTRAINT "StartTransactions_connectorDatabaseId_fkey" FOREIGN KEY ("connectorDatabaseId")
        REFERENCES "Connectors"(id) ON UPDATE CASCADE ON DELETE SET NULL`,
  },
  {
    table: 'StopTransactions',
    ddl: `
      id                      integer NOT NULL DEFAULT nextval('"StopTransactions_id_seq"'),
      "ocppConnectionName"    varchar(255),
      "transactionDatabaseId" integer,
      "meterStop"             integer,
      "timestamp"             timestamptz,
      reason                  varchar(255),
      "createdAt"             timestamptz NOT NULL,
      "updatedAt"             timestamptz NOT NULL,
      "tenantId"              integer NOT NULL DEFAULT 1,
      "idTokenValue"          varchar(255),
      "idTokenType"           varchar(255),
      "transactionCreatedAt"  timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (id, "transactionCreatedAt"),
      CONSTRAINT "StopTransactions_transactionDatabaseId_key"
        UNIQUE ("transactionDatabaseId", "transactionCreatedAt")`,
    columns: `id, "ocppConnectionName", "transactionDatabaseId", "meterStop", "timestamp", reason,
      "createdAt", "updatedAt", "tenantId", "idTokenValue", "idTokenType", "transactionCreatedAt"`,
    fks: `
      ADD CONSTRAINT "StopTransactions_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "Tenants"(id) ON UPDATE CASCADE ON DELETE RESTRICT`,
  },
  {
    table: 'ChargingNeeds',
    ddl: `
      id                        integer NOT NULL DEFAULT nextval('"ChargingNeeds_id_seq"'),
      "acChargingParameters"    jsonb,
      "dcChargingParameters"    jsonb,
      "departureTime"           timestamptz,
      "requestedEnergyTransfer" varchar(255),
      "maxScheduleTuples"       integer,
      "evseId"                  integer,
      "transactionDatabaseId"   integer,
      "createdAt"               timestamptz NOT NULL,
      "updatedAt"               timestamptz NOT NULL,
      "tenantId"                integer NOT NULL DEFAULT 1,
      "transactionCreatedAt"    timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (id, "transactionCreatedAt")`,
    columns: `id, "acChargingParameters", "dcChargingParameters", "departureTime",
      "requestedEnergyTransfer", "maxScheduleTuples", "evseId", "transactionDatabaseId",
      "createdAt", "updatedAt", "tenantId", "transactionCreatedAt"`,
    fks: `
      ADD CONSTRAINT "ChargingNeeds_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "Tenants"(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      ADD CONSTRAINT "ChargingNeeds_evseId_fkey" FOREIGN KEY ("evseId")
        REFERENCES "Evses"(id) ON UPDATE CASCADE ON DELETE SET NULL`,
  },
  {
    table: 'MeterValues',
    ddl: `
      id                          integer NOT NULL DEFAULT nextval('"MeterValues_id_seq"'),
      "transactionEventId"        integer,
      "transactionDatabaseId"     integer,
      "stopTransactionDatabaseId" integer,
      "sampledValue"              json,
      "timestamp"                 timestamptz,
      "connectorId"               integer,
      "createdAt"                 timestamptz NOT NULL,
      "updatedAt"                 timestamptz NOT NULL,
      "tenantId"                  integer NOT NULL DEFAULT 1,
      "customData"                jsonb,
      "tariffId"                  integer,
      "transactionId"             varchar(255),
      "transactionCreatedAt"      timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (id, "transactionCreatedAt")`,
    columns: `id, "transactionEventId", "transactionDatabaseId", "stopTransactionDatabaseId",
      "sampledValue", "timestamp", "connectorId", "createdAt", "updatedAt", "tenantId",
      "customData", "tariffId", "transactionId", "transactionCreatedAt"`,
    fks: `
      ADD CONSTRAINT "MeterValues_tenantId_fkey" FOREIGN KEY ("tenantId")
        REFERENCES "Tenants"(id) ON UPDATE CASCADE ON DELETE RESTRICT,
      ADD CONSTRAINT "MeterValues_tariffId_fkey" FOREIGN KEY ("tariffId")
        REFERENCES "Tariffs"(id) ON UPDATE CASCADE ON DELETE SET NULL`,
  },
];

/** Creates monthly partitions from the retention cutoff to now + FUTURE_MONTHS. */
function partitionDo(parent: string, source: string, key: string): string {
  return `DO $do$
    DECLARE
      m        timestamptz;
      part     text;
      lo       timestamptz;
      hi       timestamptz := date_trunc('month', now(), 'UTC')
                              + make_interval(months => ${FUTURE_MONTHS});
      is_first boolean := true;
    BEGIN
      EXECUTE format('SELECT date_trunc(''month'', min(%I), ''UTC'') FROM %I', '${key}', '${source}')
        INTO lo;
      lo := GREATEST(COALESCE(lo, date_trunc('month', now(), 'UTC')),
                     date_trunc('month', ${CUTOFF}, 'UTC'));
      FOR m IN SELECT generate_series(lo, hi, interval '1 month') LOOP
        part := '${parent}_' || to_char(m AT TIME ZONE 'UTC', 'YYYY"m"MM');
        IF is_first THEN
          EXECUTE format('CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (MINVALUE) TO (%L)',
                         part, '${parent}', m + interval '1 month');
          is_first := false;
        ELSE
          EXECUTE format('CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                         part, '${parent}', m, m + interval '1 month');
        END IF;
      END LOOP;
    END $do$`;
}

/** Drops the pre-swap table only when nothing fell outside retention. */
function guardedDrop(table: string, key: string): string {
  return `DO $do$
    DECLARE remaining bigint;
    BEGIN
      EXECUTE format('SELECT count(*) FROM %I WHERE %I < ${CUTOFF}', '${table}_old', '${key}')
        INTO remaining;
      IF remaining = 0 THEN
        EXECUTE format('DROP TABLE %I', '${table}_old');
      ELSE
        RAISE NOTICE '%_old KEPT: % rows outside retention -- archive, then DROP TABLE it',
          '${table}', remaining;
      END IF;
    END $do$`;
}

export default {
  up: async (queryInterface: QueryInterface) => {
    const raw = (sql: string) => queryInterface.sequelize.query(sql, { type: QueryTypes.RAW });

    // ── Retention, defined once and overridable per session ────────────────────
    await raw(`
      CREATE OR REPLACE FUNCTION transactions_retention_cutoff() RETURNS timestamptz
      LANGUAGE sql STABLE AS $fn$
        SELECT date_trunc('month', now(), 'UTC')
             - make_interval(months => COALESCE(
                 NULLIF(current_setting('transactions.retain_months', true), '')::int, 12) - 1)
      $fn$`);

    // ── Transactions: swap in one transaction ─────────────────────────────────
    await queryInterface.sequelize.transaction(async (transaction) => {
      const t = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      await t(`SET LOCAL lock_timeout = '5s'`);

      // Child FKs target Transactions(id); the PK becomes (id, "createdAt").
      for (const c of [
        'ChargingNeeds',
        'ChargingProfiles',
        'MeterValues',
        'StartTransactions',
        'StopTransactions',
        'TransactionEvents',
      ]) {
        await t(`ALTER TABLE "${c}" DROP CONSTRAINT IF EXISTS "${c}_transactionDatabaseId_fkey"`);
      }

      await t(`ALTER TABLE "Transactions" RENAME TO "Transactions_old"`);
      await t(`ALTER INDEX "Transactions_pkey" RENAME TO "Transactions_old_pkey"`);
      await t(
        `ALTER INDEX IF EXISTS "stationId_transactionId" RENAME TO "Transactions_old_station_txn"`,
      );

      // The old UNIQUE (stationId, transactionId) is NOT recreated: on a partitioned
      // table it would have to include "createdAt" and would then permit duplicates
      // across months. "TransactionKeys" below carries that guarantee instead.
      await t(`
        CREATE TABLE "Transactions" (
          id                   integer NOT NULL DEFAULT nextval('"Transactions_id_seq"'),
          "ocppConnectionName" varchar(255),
          "transactionId"      varchar(255),
          "isActive"           boolean,
          "chargingState"      varchar(255),
          "timeSpentCharging"  bigint,
          "totalKwh"           numeric,
          "stoppedReason"      varchar(255),
          "remoteStartId"      integer,
          "totalCost"          numeric,
          "createdAt"          timestamptz NOT NULL,
          "updatedAt"          timestamptz NOT NULL,
          "tenantId"           integer NOT NULL DEFAULT 1,
          "locationId"         integer,
          "evseId"             integer,
          "connectorId"        integer,
          "authorizationId"    integer,
          "tariffId"           integer,
          "startTime"          timestamptz,
          "endTime"            timestamptz,
          "customData"         jsonb,
          "meterStart"         numeric,
          "stationId"          integer,
          "transactionLimit"   jsonb,
          PRIMARY KEY (id, "createdAt")
        ) PARTITION BY RANGE ("createdAt")`);

      await t(`ALTER SEQUENCE "Transactions_id_seq" OWNED BY "Transactions".id`);
      await t(partitionDo('Transactions', 'Transactions_old', 'createdAt'));

      const cols = `id, "ocppConnectionName", "transactionId", "isActive", "chargingState",
        "timeSpentCharging", "totalKwh", "stoppedReason", "remoteStartId", "totalCost",
        "createdAt", "updatedAt", "tenantId", "locationId", "evseId", "connectorId",
        "authorizationId", "tariffId", "startTime", "endTime", "customData",
        "meterStart", "stationId", "transactionLimit"`;
      await t(`INSERT INTO "Transactions" (${cols}) SELECT ${cols}
                 FROM "Transactions_old" WHERE "createdAt" >= ${CUTOFF}`);
      await t(`SELECT setval('"Transactions_id_seq"',
                 GREATEST((SELECT COALESCE(max(id), 1) FROM "Transactions"),
                          (SELECT COALESCE(max(id), 1) FROM "Transactions_old")))`);

      await t(`
        ALTER TABLE "Transactions"
          ADD CONSTRAINT "Transactions_tenantId_fkey" FOREIGN KEY ("tenantId")
            REFERENCES "Tenants"(id) ON UPDATE CASCADE ON DELETE RESTRICT,
          ADD CONSTRAINT "Transactions_stationId_fkey" FOREIGN KEY ("stationId")
            REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT "Transactions_locationId_fkey" FOREIGN KEY ("locationId")
            REFERENCES "Locations"(id) ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT "Transactions_evseId_fkey" FOREIGN KEY ("evseId")
            REFERENCES "Evses"(id) ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT "Transactions_connectorId_fkey" FOREIGN KEY ("connectorId")
            REFERENCES "Connectors"(id) ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT "Transactions_authorizationId_fkey" FOREIGN KEY ("authorizationId")
            REFERENCES "Authorizations"(id) ON UPDATE CASCADE ON DELETE SET NULL,
          ADD CONSTRAINT "Transactions_tariffId_fkey" FOREIGN KEY ("tariffId")
            REFERENCES "Tariffs"(id) ON UPDATE CASCADE ON DELETE SET NULL`);

      // Unpartitioned, so PRIMARY KEY (stationId, transactionId) is a real global
      // guarantee. "createdAt" is carried so pruning tracks partition drops.
      await t(`
        CREATE TABLE "TransactionKeys" (
          "stationId"             integer      NOT NULL,
          "transactionId"         varchar(255) NOT NULL,
          "transactionDatabaseId" integer      NOT NULL,
          "tenantId"              integer      NOT NULL,
          "createdAt"             timestamptz  NOT NULL,
          PRIMARY KEY ("stationId", "transactionId"),
          CONSTRAINT "TransactionKeys_stationId_fkey" FOREIGN KEY ("stationId")
            REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE,
          CONSTRAINT "TransactionKeys_tenantId_fkey" FOREIGN KEY ("tenantId")
            REFERENCES "Tenants"(id) ON UPDATE CASCADE ON DELETE RESTRICT
        )`);
      await t(`CREATE INDEX "TransactionKeys_createdAt" ON "TransactionKeys" ("createdAt")`);
      await t(`CREATE INDEX "TransactionKeys_transactionDatabaseId"
                 ON "TransactionKeys" ("transactionDatabaseId")`);

      // NULL stationId/transactionId are skipped: the old UNIQUE treated NULLs as
      // distinct, so excluding them preserves the previous semantics.
      await t(`
        INSERT INTO "TransactionKeys"
          ("stationId", "transactionId", "transactionDatabaseId", "tenantId", "createdAt")
        SELECT "stationId", "transactionId", id, "tenantId", "createdAt"
        FROM "Transactions"
        WHERE "stationId" IS NOT NULL AND "transactionId" IS NOT NULL
        ON CONFLICT DO NOTHING`);

      await t(guardedDrop('Transactions', 'createdAt'));

      await t(`
        CREATE TRIGGER trigger_populate_transactions_station_id
          BEFORE INSERT OR UPDATE ON "Transactions"
          FOR EACH ROW WHEN (NEW."stationId" IS NULL)
          EXECUTE FUNCTION populate_station_id()`);

      // Registry maintained by the database, so a duplicate surfaces as a real
      // unique_violation and neither DAL layer needs to know the table exists.
      await t(`
        CREATE OR REPLACE FUNCTION public.register_transaction_key() RETURNS trigger
        LANGUAGE plpgsql AS $fn$
        BEGIN
          IF NEW."stationId" IS NULL OR NEW."transactionId" IS NULL THEN
            RETURN NULL;
          END IF;
          INSERT INTO "TransactionKeys"
            ("stationId", "transactionId", "transactionDatabaseId", "tenantId", "createdAt")
          VALUES (NEW."stationId", NEW."transactionId", NEW.id, NEW."tenantId", NEW."createdAt");
          RETURN NULL;
        END;
        $fn$`);
      await t(`
        CREATE TRIGGER trg_register_transaction_key
          AFTER INSERT ON "Transactions"
          FOR EACH ROW EXECUTE FUNCTION register_transaction_key()`);

      // Releases the pair when a transaction row is deleted, so the registry tracks the
      // table. The transactionDatabaseId match keeps this to the key this row registered.
      // Partition drops are DDL and fire no row trigger; rotation prunes those instead.
      await t(`
        CREATE OR REPLACE FUNCTION public.unregister_transaction_key() RETURNS trigger
        LANGUAGE plpgsql AS $fn$
        BEGIN
          DELETE FROM "TransactionKeys"
           WHERE "stationId" = OLD."stationId"
             AND "transactionId" = OLD."transactionId"
             AND "transactionDatabaseId" = OLD.id;
          RETURN NULL;
        END;
        $fn$`);
      await t(`
        CREATE TRIGGER trg_unregister_transaction_key
          AFTER DELETE ON "Transactions"
          FOR EACH ROW EXECUTE FUNCTION unregister_transaction_key()`);
    });

    // ── Children: add and backfill the partition key ──────────────────────────
    // Autocommit: the MeterValues loop below COMMITs per batch, which raises
    // "invalid transaction termination" inside an explicit transaction block.
    for (const c of CHILDREN) {
      await raw(`ALTER TABLE "${c.table}" ADD COLUMN "transactionCreatedAt" timestamptz`);
    }

    // Resolve against "Transactions_old": it holds every row, while the new table holds
    // only the retained ones. Reading the new table would resolve a child of an expired
    // transaction to its own createdAt, putting a bogus key inside the window that the
    // composite foreign key then rejects. Absent means nothing expired, so the new table is complete.
    const [{ source: txnSource }] = (await queryInterface.sequelize.query(
      `SELECT CASE WHEN to_regclass('"Transactions_old"') IS NULL
                   THEN 'Transactions' ELSE 'Transactions_old' END AS source`,
      { type: QueryTypes.SELECT },
    )) as unknown as [{ source: string }];

    for (const table of [
      'TransactionEvents',
      'StartTransactions',
      'StopTransactions',
      'ChargingNeeds',
    ]) {
      await raw(`
        UPDATE "${table}" c SET "transactionCreatedAt" = COALESCE(
          (SELECT t."createdAt" FROM "${txnSource}" t WHERE t.id = c."transactionDatabaseId"),
          c."createdAt")`);
    }

    // Cheapest path first: rows with no link at all need no subqueries.
    await raw(`
      UPDATE "MeterValues" SET "transactionCreatedAt" = "createdAt"
       WHERE "transactionCreatedAt" IS NULL
         AND "transactionDatabaseId" IS NULL
         AND "stopTransactionDatabaseId" IS NULL
         AND "transactionEventId" IS NULL`);

    // Batched: MeterValues is the largest table and every row is rewritten.
    await raw(`DO $do$
      DECLARE n int;
      BEGIN
        LOOP
          WITH batch AS (
            SELECT id FROM "MeterValues"
             WHERE "transactionCreatedAt" IS NULL
             LIMIT 50000 FOR UPDATE SKIP LOCKED
          )
          UPDATE "MeterValues" c SET "transactionCreatedAt" = COALESCE(
            (SELECT t."createdAt"            FROM "${txnSource}" t WHERE t.id = c."transactionDatabaseId"),
            (SELECT s."transactionCreatedAt" FROM "StopTransactions"  s WHERE s.id = c."stopTransactionDatabaseId"),
            (SELECT e."transactionCreatedAt" FROM "TransactionEvents" e WHERE e.id = c."transactionEventId"),
            c."createdAt")
          FROM batch WHERE c.id = batch.id;
          GET DIAGNOSTICS n = ROW_COUNT;
          EXIT WHEN n = 0;
          COMMIT;
        END LOOP;
      END $do$`);

    // A VALID CHECK lets SET NOT NULL skip its scan, so the ACCESS EXCLUSIVE window
    // is catalog-only instead of a full pass over the table.
    for (const c of CHILDREN) {
      const nn = `${c.table}_tca_nn`;
      await raw(`ALTER TABLE "${c.table}" ADD CONSTRAINT "${nn}"
                   CHECK ("transactionCreatedAt" IS NOT NULL) NOT VALID`);
      await raw(`ALTER TABLE "${c.table}" VALIDATE CONSTRAINT "${nn}"`);
      await raw(`ALTER TABLE "${c.table}" ALTER COLUMN "transactionCreatedAt" SET NOT NULL`);
      await raw(`ALTER TABLE "${c.table}" DROP CONSTRAINT "${nn}"`);
    }

    // MeterValues points at TransactionEvents(id) and StopTransactions(id), whose
    // primary keys are about to change.
    await raw(
      `ALTER TABLE "MeterValues" DROP CONSTRAINT IF EXISTS "MeterValues_transactionEventId_fkey"`,
    );
    await raw(
      `ALTER TABLE "MeterValues" DROP CONSTRAINT IF EXISTS "MeterValues_stopTransactionDatabaseId_fkey"`,
    );

    // ── Children: one transaction per table ──────────────────────────────────
    for (const c of CHILDREN) {
      await queryInterface.sequelize.transaction(async (transaction) => {
        const t = (sql: string) =>
          queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

        await t(`SET LOCAL lock_timeout = '5s'`);
        await t(`ALTER TABLE "${c.table}" RENAME TO "${c.table}_old"`);
        await t(`ALTER INDEX "${c.table}_pkey" RENAME TO "${c.table}_old_pkey"`);
        await t(`ALTER INDEX IF EXISTS "${c.table}_transactionDatabaseId_key"
                   RENAME TO "${c.table}_old_txn_key"`);

        await t(`CREATE TABLE "${c.table}" (${c.ddl}) PARTITION BY RANGE ("transactionCreatedAt")`);
        await t(`ALTER SEQUENCE "${c.table}_id_seq" OWNED BY "${c.table}".id`);
        await t(partitionDo(c.table, `${c.table}_old`, 'transactionCreatedAt'));

        // Same cutoff as Transactions: a child whose transaction was not copied
        // would violate the composite foreign key added below.
        await t(`INSERT INTO "${c.table}" (${c.columns}) SELECT ${c.columns}
                   FROM "${c.table}_old" WHERE "transactionCreatedAt" >= ${CUTOFF}`);
        await t(`SELECT setval('"${c.table}_id_seq"',
                   GREATEST((SELECT COALESCE(max(id), 1) FROM "${c.table}"),
                            (SELECT COALESCE(max(id), 1) FROM "${c.table}_old")))`);
        await t(`ALTER TABLE "${c.table}" ${c.fks}`);
        await t(guardedDrop(c.table, 'transactionCreatedAt'));
      });
    }

    // ── Indexes and composite foreign keys ───────────────────────────────────
    await queryInterface.sequelize.transaction(async (transaction) => {
      const t = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      // Production had no index on transactionDatabaseId anywhere, so every cascade
      // and every child-to-parent join was a sequential scan per partition.
      await t(
        `CREATE INDEX "meter_values_txn_ref" ON "MeterValues" ("transactionDatabaseId", "transactionCreatedAt")`,
      );
      await t(
        `CREATE INDEX "meter_values_event_ref" ON "MeterValues" ("transactionEventId", "transactionCreatedAt")`,
      );
      await t(
        `CREATE INDEX "meter_values_stop_ref" ON "MeterValues" ("stopTransactionDatabaseId", "transactionCreatedAt")`,
      );
      await t(
        `CREATE INDEX "transaction_events_txn_ref" ON "TransactionEvents" ("transactionDatabaseId", "transactionCreatedAt")`,
      );
      await t(
        `CREATE INDEX "charging_needs_txn_ref" ON "ChargingNeeds" ("transactionDatabaseId", "transactionCreatedAt")`,
      );
      // ChargingProfiles stays unpartitioned so station-level profiles outlive retention.
      // Partial: the maintenance job only ever looks for linked rows, and station-level
      // ones are the majority that never need scanning.
      await t(`CREATE INDEX "charging_profiles_txn_ref" ON "ChargingProfiles" ("transactionDatabaseId")
                 WHERE "transactionDatabaseId" IS NOT NULL`);

      for (const [table, action] of [
        ['MeterValues', 'ON UPDATE CASCADE ON DELETE CASCADE'],
        ['StartTransactions', 'ON UPDATE CASCADE ON DELETE CASCADE'],
        ['StopTransactions', 'ON UPDATE CASCADE ON DELETE CASCADE'],
        ['ChargingNeeds', 'ON UPDATE CASCADE'],
        // Was ON DELETE SET NULL, impossible now that "transactionCreatedAt" is
        // NOT NULL. Deleting a transaction now deletes its events.
        ['TransactionEvents', 'ON UPDATE CASCADE ON DELETE CASCADE'],
      ]) {
        await t(`
          ALTER TABLE "${table}"
            ADD CONSTRAINT "${table}_transactionDatabaseId_fkey"
            FOREIGN KEY ("transactionDatabaseId", "transactionCreatedAt")
            REFERENCES "Transactions"(id, "createdAt") ${action}`);
      }

      await t(`
        ALTER TABLE "MeterValues"
          ADD CONSTRAINT "MeterValues_transactionEventId_fkey"
          FOREIGN KEY ("transactionEventId", "transactionCreatedAt")
          REFERENCES "TransactionEvents"(id, "transactionCreatedAt")
          ON UPDATE CASCADE ON DELETE CASCADE`);
      await t(`
        ALTER TABLE "MeterValues"
          ADD CONSTRAINT "MeterValues_stopTransactionDatabaseId_fkey"
          FOREIGN KEY ("stopTransactionDatabaseId", "transactionCreatedAt")
          REFERENCES "StopTransactions"(id, "transactionCreatedAt")
          ON UPDATE CASCADE ON DELETE CASCADE`);
    });

    // ── Rotation: provisions future months, drops expired ones ────────────────
    // Not scheduled here. provision-partitions.ts calls it provision-only on every
    // start; dropping is destructive and belongs to a job that archives first.
    await raw(`
      CREATE OR REPLACE PROCEDURE rotate_transactions_partitions(
        p_retain_months int     DEFAULT 12,
        p_future_months int     DEFAULT ${FUTURE_MONTHS},
        p_dry_run       boolean DEFAULT false
      ) LANGUAGE plpgsql AS $proc$
      DECLARE
        parents text[] := ARRAY['Transactions','TransactionEvents','StartTransactions',
                                'StopTransactions','ChargingNeeds','MeterValues'];
        p text; m timestamptz; part text; cutoff timestamptz; rec record; part_month timestamptz;
        idx int; pruned bigint;
      BEGIN
        cutoff := date_trunc('month', now(), 'UTC') - make_interval(months => p_retain_months - 1);

        -- Create pass, parents before children: a month must exist on "Transactions"
        -- before anything references it.
        FOREACH p IN ARRAY parents LOOP
          FOR m IN SELECT generate_series(
                     date_trunc('month', now(), 'UTC'),
                     date_trunc('month', now(), 'UTC') + make_interval(months => p_future_months),
                     interval '1 month')
          LOOP
            part := p || '_' || to_char(m AT TIME ZONE 'UTC', 'YYYY"m"MM');
            IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part) THEN
              IF p_dry_run THEN
                RAISE NOTICE 'would create %', part;
              ELSE
                EXECUTE format('CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                               part, p, m, m + interval '1 month');
                RAISE NOTICE 'created %', part;
              END IF;
            END IF;
          END LOOP;
        END LOOP;

        -- Drop pass in reverse: every child month is removed before the "Transactions"
        -- month it references, so no partition is ever left holding dangling keys.
        -- DETACH always precedes DROP; see the note on the DROP itself.
        FOR idx IN REVERSE array_length(parents, 1)..1 LOOP
          p := parents[idx];
          FOR rec IN
            SELECT c.relname FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
             WHERE i.inhparent = to_regclass(quote_ident(p))
               AND c.relname ~ ('^' || p || '_[0-9]{4}m[0-9]{2}$')
             ORDER BY c.relname
          LOOP
            -- Gregorian YYYY, never IYYY: mixing an ISO year with a Gregorian month
            -- is rejected outright. AT TIME ZONE 'UTC' anchors it to the partition
            -- bounds, which are UTC month boundaries, not the session timezone.
            part_month := to_date(right(rec.relname, 7), 'YYYY"m"MM') AT TIME ZONE 'UTC';
            IF part_month < cutoff THEN
              IF p_dry_run THEN
                RAISE NOTICE 'would detach and drop % (month %)', rec.relname, part_month;
              ELSE
                -- A plain DROP is refused while an inbound composite FK depends on the
                -- partition, and DROP CASCADE would delete the child constraints
                -- themselves. Detaching first clears the dependency and leaves all
                -- foreign keys intact. Both run in one transaction, so a failure undoes both.
                EXECUTE format('ALTER TABLE %I DETACH PARTITION %I', p, rec.relname);
                EXECUTE format('DROP TABLE %I', rec.relname);
                RAISE NOTICE 'detached and dropped % (month %)', rec.relname, part_month;
              END IF;
            END IF;
          END LOOP;
        END LOOP;

        -- "TransactionKeys" survives partition drops, since DROP TABLE is DDL and fires no
        -- row trigger. Only keys whose transaction is actually gone are released: the first
        -- partition is MINVALUE-bounded, so a row far older than the cutoff can still be
        -- live, and releasing its pair would let a duplicate in. cutoff only bounds the scan.
        IF p_dry_run THEN
          SELECT count(*) INTO pruned
            FROM "TransactionKeys" k
           WHERE k."createdAt" < cutoff
             AND NOT EXISTS (SELECT 1 FROM "Transactions" t
                              WHERE t.id = k."transactionDatabaseId"
                                AND t."createdAt" = k."createdAt");
          IF pruned > 0 THEN
            RAISE NOTICE 'would prune % orphaned registry key(s) older than %', pruned, cutoff;
          END IF;
        ELSE
          DELETE FROM "TransactionKeys" k
           WHERE k."createdAt" < cutoff
             AND NOT EXISTS (SELECT 1 FROM "Transactions" t
                              WHERE t.id = k."transactionDatabaseId"
                                AND t."createdAt" = k."createdAt");
          GET DIAGNOSTICS pruned = ROW_COUNT;
          IF pruned > 0 THEN
            RAISE NOTICE 'pruned % orphaned registry key(s) older than %', pruned, cutoff;
          END IF;
        END IF;
      END $proc$`);

    for (const p of ['Transactions', ...CHILDREN.map((c) => c.table)]) {
      await raw(`ANALYZE "${p}"`);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const raw = (sql: string) => queryInterface.sequelize.query(sql, { type: QueryTypes.RAW });

    // Reversible only while the *_old tables still exist; once archived and dropped
    // they are the only copy of anything outside the retention window.
    for (const table of ['Transactions', ...CHILDREN.map((c) => c.table)]) {
      const [rows] = (await queryInterface.sequelize.query(
        `SELECT count(*)::int AS n FROM pg_class WHERE relname = '${table}_old'`,
        { type: QueryTypes.SELECT },
      )) as unknown as [{ n: number }];
      if (!rows || rows.n === 0) {
        throw new Error(`${table}_old no longer exists — this migration cannot be reverted`);
      }
    }

    await raw(`DROP PROCEDURE IF EXISTS rotate_transactions_partitions(int, int, boolean)`);

    // Composite FKs first: they reference the partitioned tables being dropped.
    for (const table of [
      'MeterValues',
      'StartTransactions',
      'StopTransactions',
      'ChargingNeeds',
      'TransactionEvents',
    ]) {
      await raw(
        `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${table}_transactionDatabaseId_fkey"`,
      );
    }
    await raw(
      `ALTER TABLE "MeterValues" DROP CONSTRAINT IF EXISTS "MeterValues_transactionEventId_fkey"`,
    );
    await raw(
      `ALTER TABLE "MeterValues" DROP CONSTRAINT IF EXISTS "MeterValues_stopTransactionDatabaseId_fkey"`,
    );

    // Children, then Transactions: carry post-swap rows back, then restore.
    for (const c of [...CHILDREN].reverse()) {
      await queryInterface.sequelize.transaction(async (transaction) => {
        const t = (sql: string) =>
          queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });
        await t(`SET LOCAL lock_timeout = '5s'`);
        const cols = c.columns.replace(/,\s*"transactionCreatedAt"\s*$/, '');
        await t(`ALTER TABLE "${c.table}_old" DISABLE TRIGGER USER`);
        await t(`INSERT INTO "${c.table}_old" (${cols}) SELECT ${cols} FROM "${c.table}" n
                   WHERE NOT EXISTS (SELECT 1 FROM "${c.table}_old" o WHERE o.id = n.id)`);
        await t(`ALTER TABLE "${c.table}_old" ENABLE TRIGGER USER`);
        await t(`ALTER SEQUENCE "${c.table}_id_seq" OWNED BY "${c.table}_old".id`);
        await t(`DROP TABLE "${c.table}"`);
        await t(`ALTER TABLE "${c.table}_old" RENAME TO "${c.table}"`);
        await t(`ALTER INDEX "${c.table}_old_pkey" RENAME TO "${c.table}_pkey"`);
        await t(`ALTER INDEX IF EXISTS "${c.table}_old_txn_key"
                   RENAME TO "${c.table}_transactionDatabaseId_key"`);
        await t(`ALTER TABLE "${c.table}" DROP COLUMN IF EXISTS "transactionCreatedAt"`);
      });
    }

    await queryInterface.sequelize.transaction(async (transaction) => {
      const t = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });
      await t(`SET LOCAL lock_timeout = '5s'`);
      const cols = `id, "ocppConnectionName", "transactionId", "isActive", "chargingState",
        "timeSpentCharging", "totalKwh", "stoppedReason", "remoteStartId", "totalCost",
        "createdAt", "updatedAt", "tenantId", "locationId", "evseId", "connectorId",
        "authorizationId", "tariffId", "startTime", "endTime", "customData",
        "meterStart", "stationId", "transactionLimit"`;
      await t(`ALTER TABLE "Transactions_old" DISABLE TRIGGER USER`);
      await t(`INSERT INTO "Transactions_old" (${cols}) SELECT ${cols} FROM "Transactions" n
                 WHERE NOT EXISTS (SELECT 1 FROM "Transactions_old" o WHERE o.id = n.id)`);
      await t(`ALTER TABLE "Transactions_old" ENABLE TRIGGER USER`);
      await t(`ALTER SEQUENCE "Transactions_id_seq" OWNED BY "Transactions_old".id`);
      await t(`DROP TABLE "Transactions"`);
      await t(`DROP TABLE IF EXISTS "TransactionKeys"`);
      await t(`ALTER TABLE "Transactions_old" RENAME TO "Transactions"`);
      await t(`ALTER INDEX "Transactions_old_pkey" RENAME TO "Transactions_pkey"`);
      await t(`ALTER INDEX IF EXISTS "Transactions_old_station_txn"
                 RENAME TO "stationId_transactionId"`);

      // ChargingProfiles is never dropped by this migration, so its index must be removed
      // explicitly or re-running up() fails with "already exists".
      await t(`DROP INDEX IF EXISTS "charging_profiles_txn_ref"`);

      // Restore the single-column child FKs the partitioned form could not carry.
      for (const [table, action] of [
        ['ChargingNeeds', 'ON UPDATE CASCADE'],
        ['ChargingProfiles', 'ON UPDATE CASCADE ON DELETE SET NULL'],
        ['MeterValues', 'ON UPDATE CASCADE ON DELETE CASCADE'],
        ['StartTransactions', 'ON UPDATE CASCADE ON DELETE CASCADE'],
        ['StopTransactions', 'ON UPDATE CASCADE ON DELETE CASCADE'],
        ['TransactionEvents', 'ON UPDATE CASCADE ON DELETE SET NULL'],
      ]) {
        await t(`ALTER TABLE "${table}"
                   ADD CONSTRAINT "${table}_transactionDatabaseId_fkey"
                   FOREIGN KEY ("transactionDatabaseId") REFERENCES "Transactions"(id) ${action}`);
      }
      await t(`ALTER TABLE "MeterValues"
                 ADD CONSTRAINT "MeterValues_transactionEventId_fkey"
                 FOREIGN KEY ("transactionEventId") REFERENCES "TransactionEvents"(id)
                 ON UPDATE CASCADE ON DELETE CASCADE`);
      await t(`ALTER TABLE "MeterValues"
                 ADD CONSTRAINT "MeterValues_stopTransactionDatabaseId_fkey"
                 FOREIGN KEY ("stopTransactionDatabaseId") REFERENCES "StopTransactions"(id)
                 ON UPDATE CASCADE ON DELETE CASCADE`);
      await t(`DROP TRIGGER IF EXISTS trg_register_transaction_key ON "Transactions"`);
      await t(`DROP TRIGGER IF EXISTS trg_unregister_transaction_key ON "Transactions"`);
      await t(`
        CREATE OR REPLACE TRIGGER trigger_populate_transactions_station_id
          BEFORE INSERT OR UPDATE ON "Transactions"
          FOR EACH ROW WHEN (NEW."stationId" IS NULL)
          EXECUTE FUNCTION populate_station_id()`);
    });

    await raw(`DROP FUNCTION IF EXISTS register_transaction_key()`);
    await raw(`DROP FUNCTION IF EXISTS unregister_transaction_key()`);
    await raw(`DROP FUNCTION IF EXISTS transactions_retention_cutoff()`);
  },
};
