// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface, QueryTypes, Transaction } from 'sequelize';

/**
 * Weekly range partitions for "OCPPMessages" via staging table + rename swap: the heap is only read.
 * @type {import('sequelize-cli').Migration}
 */

/** Partitions kept behind the current week. 1 => current week + previous week. */
const WEEKS_BACK = 1;
/** Partitions provisioned beyond the current week. */
const WEEKS_AHEAD = 1;
/** Ids of slack subtracted from the discovered watermark, and the width of the straggler check. */
const ID_MARGIN = 1_000_000;

const COLUMNS = `
  id, "ocppConnectionName", "correlationId", origin, protocol, action,
  "timestamp", "createdAt", "updatedAt", "tenantId", "requestMessageId",
  "stationId", type, state, payload, raw, message`;

/** Same list, qualified for the catch-up's anti-join against the new table. */
const COLUMNS_QUALIFIED = `
  o.id, o."ocppConnectionName", o."correlationId", o.origin, o.protocol, o.action,
  o."timestamp", o."createdAt", o."updatedAt", o."tenantId", o."requestMessageId",
  o."stationId", o.type, o.state, o.payload, o.raw, o.message`;

/**
 * Largest id whose "createdAt" precedes the cutoff, minus ID_MARGIN. Used instead of a
 * "createdAt" predicate, which would seq-scan the whole heap for want of an index.
 */
async function findIdWatermark(
  queryInterface: QueryInterface,
  transaction: Transaction,
  cutoff: string,
): Promise<number> {
  const bounds = await queryInterface.sequelize.query<{ lo: string | null; hi: string | null }>(
    `SELECT min(id)::text AS lo, max(id)::text AS hi FROM "OCPPMessages"`,
    { transaction, type: QueryTypes.SELECT },
  );
  // the table exists but has no rows yet. 0 makes the copy a no-op while the rest of the
  // migration still partitions the table.
  if (!bounds[0]?.lo) {
    return 0;
  }

  let lo = Number(bounds[0].lo);
  let hi = Number(bounds[0].hi);
  let watermark = lo - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const probe = await queryInterface.sequelize.query<{ id: string; isOlder: boolean }>(
      `SELECT id::text AS id, ("createdAt" < :cutoff::timestamptz) AS "isOlder"
         FROM "OCPPMessages"
        WHERE id >= :mid AND id <= :hi
        ORDER BY id LIMIT 1`,
      { transaction, type: QueryTypes.SELECT, replacements: { mid, hi, cutoff } },
    );

    if (probe.length === 0) {
      hi = mid - 1; // no row exists in [mid, hi]
    } else if (probe[0].isOlder) {
      watermark = Number(probe[0].id);
      lo = watermark + 1;
    } else {
      hi = Number(probe[0].id) - 1;
    }
  }

  return Math.max(watermark - ID_MARGIN, 0);
}

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const raw = (sql: string, replacements?: Record<string, unknown>) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW, replacements });

      // Partition bounds are timestamptz literals and date_trunc('week', ...) resolves against the
      // session timezone, so both must be evaluated in UTC or the boundaries land on local midnight.
      await raw(`SET LOCAL timezone = 'UTC'`);
      // ACCESS EXCLUSIVE queues behind any in-flight reader, and everything arriving afterwards
      // queues behind it. Fail fast and retry rather than stalling the table.
      await raw(`SET LOCAL lock_timeout = '5s'`);

      const [meta] = await queryInterface.sequelize.query<{ seq: string; cutoff: string }>(
        `SELECT pg_get_serial_sequence('"OCPPMessages"', 'id') AS seq,
                (date_trunc('week', now()) - make_interval(weeks => :weeksBack))::text AS cutoff`,
        { transaction, type: QueryTypes.SELECT, replacements: { weeksBack: WEEKS_BACK } },
      );
      if (!meta?.seq) {
        throw new Error('Could not resolve the OCPPMessages id sequence');
      }
      const { seq, cutoff } = meta;

      const watermark = await findIdWatermark(queryInterface, transaction, cutoff);

      // Refuse to continue if any row inside the retention window sits below the biased watermark;
      // it would be silently left behind. Index range scan over the margin band, not a seq scan.
      const [stragglers] = await queryInterface.sequelize.query<{ n: string }>(
        `SELECT count(*)::text AS n FROM "OCPPMessages"
          WHERE id > :low AND id <= :watermark AND "createdAt" >= :cutoff::timestamptz`,
        {
          transaction,
          type: QueryTypes.SELECT,
          replacements: { low: Math.max(watermark - ID_MARGIN, 0), watermark, cutoff },
        },
      );
      if (Number(stragglers.n) > 0) {
        throw new Error(
          `${stragglers.n} rows below the watermark fall inside the retention window — raise ID_MARGIN`,
        );
      }

      // Index names are schema-global, so the staging table cannot reuse the live ones.
      await raw(`DO $$
        DECLARE r record;
        BEGIN
          FOR r IN SELECT indexname FROM pg_indexes
                    WHERE schemaname = 'public' AND tablename = 'OCPPMessages'
          LOOP
            EXECUTE format('ALTER INDEX %I RENAME TO %I', r.indexname, 'old_' || r.indexname);
          END LOOP;
        END $$`);

      await raw(`
        CREATE TABLE "OCPPMessages_partition" (
          id                   integer NOT NULL,
          "ocppConnectionName" varchar(255),
          "correlationId"      varchar(255),
          origin               varchar(255),
          protocol             varchar(255),
          action               varchar(255),
          "timestamp"          timestamptz,
          "createdAt"          timestamptz NOT NULL,
          "updatedAt"          timestamptz NOT NULL,
          "tenantId"           integer NOT NULL DEFAULT 1,
          "requestMessageId"   integer,
          "stationId"          integer,
          type                 integer,
          state                varchar(255),
          payload              jsonb,
          raw                  text NOT NULL,
          message              jsonb,
          PRIMARY KEY (id, "createdAt")
        ) PARTITION BY RANGE ("createdAt")`);

      // Oldest partition uses MINVALUE so an old "createdAt" — or a row pulled in by the
      // watermark margin — still has somewhere to land. There is deliberately no DEFAULT
      // partition, so inserts FAIL once WEEKS_AHEAD is exhausted:
      // rotate_ocpp_messages_partitions() is created below but must be scheduled separately.
      await raw(
        `DO $$
        DECLARE
          wk       date;
          wk_from  date := (date_trunc('week', now()) - make_interval(weeks => ${WEEKS_BACK}))::date;
          wk_to    date := (date_trunc('week', now()) + make_interval(weeks => ${WEEKS_AHEAD}))::date;
          is_first boolean := true;
        BEGIN
          FOR wk IN SELECT generate_series(wk_from, wk_to, interval '1 week')::date LOOP
            IF is_first THEN
              EXECUTE format(
                'CREATE TABLE %I PARTITION OF "OCPPMessages_partition" FOR VALUES FROM (MINVALUE) TO (%L)',
                'OCPPMessages_' || to_char(wk, 'IYYY"w"IW'), (wk + 7)::timestamptz);
              is_first := false;
            ELSE
              EXECUTE format(
                'CREATE TABLE %I PARTITION OF "OCPPMessages_partition" FOR VALUES FROM (%L) TO (%L)',
                'OCPPMessages_' || to_char(wk, 'IYYY"w"IW'), wk::timestamptz, (wk + 7)::timestamptz);
            END IF;
          END LOOP;
        END $$`,
      );

      // Primary-key range scan over the live table under ACCESS SHARE. No triggers exist on the
      // staging table yet, so requestMessageId links transfer verbatim rather than being re-derived.
      await raw(
        `INSERT INTO "OCPPMessages_partition" (${COLUMNS})
         SELECT ${COLUMNS} FROM "OCPPMessages" WHERE id > :watermark`,
        { watermark },
      );

      await raw(
        `CREATE INDEX "ocpp_messages_request_message_id" ON "OCPPMessages_partition" ("requestMessageId")`,
      );
      await raw(
        `CREATE INDEX "ocpp_messages_correlation_id" ON "OCPPMessages_partition" ("correlationId")`,
      );
      await raw(
        `CREATE INDEX "ocpp_messages_ocpp_connection_name" ON "OCPPMessages_partition" ("ocppConnectionName")`,
      );
      await raw(
        `CREATE INDEX "ocpp_messages_correlation_lookup"
           ON "OCPPMessages_partition" ("tenantId", "ocppConnectionName", "correlationId")`,
      );

      // Validated against only the copied rows. requestMessageId gets no foreign key: a FK must
      // target a complete unique key, and (id) alone is no longer one. It becomes a soft
      // reference maintained by ocpp_correlate_response()/ocpp_correlate_call().
      await raw(`
        ALTER TABLE "OCPPMessages_partition"
          ADD CONSTRAINT "OCPPMessages_tenantId_fkey" FOREIGN KEY ("tenantId")
            REFERENCES "Tenants"(id) ON UPDATE CASCADE ON DELETE RESTRICT,
          ADD CONSTRAINT "OCPPMessages_stationId_fkey" FOREIGN KEY ("stationId")
            REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE SET NULL`);

      // ── Swap ──────────────────────────────────────────────────────────────────────
      await raw(`ALTER TABLE "OCPPMessages" RENAME TO "OCPPMessages_old"`);
      await raw(`ALTER TABLE "OCPPMessages_partition" RENAME TO "OCPPMessages"`);

      // Rows written to the old heap after the bulk copy began. Anti-joined on the primary key
      // rather than trusting the watermark alone, because concurrent inserts commit out of id order.
      await raw(
        `INSERT INTO "OCPPMessages" (${COLUMNS})
         SELECT ${COLUMNS_QUALIFIED}
           FROM "OCPPMessages_old" o
          WHERE o.id > :watermark
            AND NOT EXISTS (
              SELECT 1 FROM "OCPPMessages" n
               WHERE n.id = o.id AND n."createdAt" = o."createdAt")`,
        { watermark },
      );

      // The sequence still belongs to the old heap's column; dropping that table later would take
      // the sequence with it and break every subsequent insert.
      await raw(`ALTER TABLE "OCPPMessages" ALTER COLUMN id SET DEFAULT nextval('${seq}')`);
      await raw(`ALTER SEQUENCE ${seq} OWNED BY "OCPPMessages".id`);
      await raw(
        `SELECT setval('${seq}', GREATEST((SELECT max(id) FROM "OCPPMessages"),
                                          (SELECT max(id) FROM "OCPPMessages_old")))`,
      );

      // Triggers last, so they govern only new traffic. Cloned onto every partition automatically,
      // present and future. Functions are unchanged by this migration.
      await raw(`
        CREATE TRIGGER "trg_ocpp_correlate_response"
          BEFORE INSERT ON "OCPPMessages"
          FOR EACH ROW
          WHEN (
            NEW."correlationId" IS NOT NULL
            AND NEW."requestMessageId" IS NULL
            AND NEW."type" IN (3, 4)
          )
          EXECUTE FUNCTION ocpp_correlate_response()`);
      await raw(`
        CREATE TRIGGER "trg_ocpp_correlate_call"
          AFTER INSERT ON "OCPPMessages"
          FOR EACH ROW
          WHEN (NEW."correlationId" IS NOT NULL AND NEW."type" = 2)
          EXECUTE FUNCTION ocpp_correlate_call()`);
      await raw(`
        CREATE TRIGGER "trigger_populate_ocppmessages_station_id"
          BEFORE INSERT OR UPDATE ON "OCPPMessages"
          FOR EACH ROW WHEN (NEW."stationId" IS NULL)
          EXECUTE FUNCTION populate_station_id()`);

      // Provisions the current week plus p_future_weeks, and drops weekly partitions older than
      // p_retain_weeks. The regex confines it to rotation-managed names. NOT scheduled by this
      // migration — see the header note.
      await raw(`
        CREATE OR REPLACE PROCEDURE rotate_ocpp_messages_partitions(
          p_retain_weeks int     DEFAULT ${WEEKS_BACK + 1},
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
            part := 'OCPPMessages_' || to_char(wk, 'IYYY"w"IW');
            IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = part) THEN
              IF p_dry_run THEN
                RAISE NOTICE 'would create %', part;
              ELSE
                EXECUTE format(
                  'CREATE TABLE %I PARTITION OF "OCPPMessages" FOR VALUES FROM (%L) TO (%L)',
                  part, wk::timestamptz, (wk + 7)::timestamptz);
                RAISE NOTICE 'created %', part;
              END IF;
            END IF;
          END LOOP;

          cutoff := (date_trunc('week', now()) - make_interval(weeks => p_retain_weeks - 1))::date;

          FOR rec IN
            SELECT c.relname FROM pg_inherits i JOIN pg_class c ON c.oid = i.inhrelid
             WHERE i.inhparent = '"OCPPMessages"'::regclass
               AND c.relname ~ '^OCPPMessages_[0-9]{4}w[0-9]{2}$'
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

    // Outside the transaction: the planner needs statistics for the table it is about to serve all
    // production traffic against.
    await queryInterface.sequelize.query(`ANALYZE "OCPPMessages"`, { type: QueryTypes.RAW });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const raw = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      await raw(`SET LOCAL timezone = 'UTC'`);
      await raw(`SET LOCAL lock_timeout = '5s'`);

      // The original heap is the only copy of anything older than the retention window. Once it has
      // been archived and dropped, this migration is not reversible.
      const [exists] = await queryInterface.sequelize.query<{ n: string }>(
        `SELECT count(*)::text AS n FROM pg_class WHERE relname = 'OCPPMessages_old'`,
        { transaction, type: QueryTypes.SELECT },
      );
      if (Number(exists.n) === 0) {
        throw new Error(
          'OCPPMessages_old no longer exists — the partitioning migration cannot be reverted',
        );
      }

      // Carry back anything written since the swap. Triggers off for the copy:
      // ocpp_correlate_call() takes an advisory lock per row, so a multi-row insert
      // exhausts the lock table. The links are already resolved in the copied data.
      // USER leaves the referential-integrity triggers active.
      await raw(`ALTER TABLE "OCPPMessages_old" DISABLE TRIGGER USER`);
      await raw(`
        INSERT INTO "OCPPMessages_old" (${COLUMNS})
        SELECT ${COLUMNS} FROM "OCPPMessages" n
         WHERE NOT EXISTS (
           SELECT 1 FROM "OCPPMessages_old" o WHERE o.id = n.id)`);
      await raw(`ALTER TABLE "OCPPMessages_old" ENABLE TRIGGER USER`);

      // The sequence is OWNED BY the partitioned table's column, but
      // "OCPPMessages_old".id still uses it as a DEFAULT, so the drop below is
      // refused until ownership moves. Reassigning first also means the rename
      // that follows leaves ownership already pointing at the right column.
      const [seqMeta] = await queryInterface.sequelize.query<{ seq: string | null }>(
        `SELECT pg_get_serial_sequence('"OCPPMessages"', 'id') AS seq`,
        { transaction, type: QueryTypes.SELECT },
      );
      if (seqMeta?.seq) {
        await raw(`ALTER SEQUENCE ${seqMeta.seq} OWNED BY "OCPPMessages_old".id`);
      }

      await raw(`DROP TABLE "OCPPMessages"`);
      await raw(`ALTER TABLE "OCPPMessages_old" RENAME TO "OCPPMessages"`);

      await raw(`DO $$
        DECLARE r record;
        BEGIN
          FOR r IN SELECT indexname FROM pg_indexes
                    WHERE schemaname = 'public' AND tablename = 'OCPPMessages'
                      AND indexname LIKE 'old\\_%'
          LOOP
            EXECUTE format('ALTER INDEX %I RENAME TO %I', r.indexname, substr(r.indexname, 5));
          END LOOP;
        END $$`);

      // `up` leaves the original table's own constraints and triggers untouched, so the
      // table restored above normally still carries them. Both restorations are therefore
      // guarded rather than unconditional. CREATE TRIGGER and ADD CONSTRAINT would
      // otherwise fail with "already exists".
      await raw(`DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
             WHERE conname = 'OCPPMessages_requestMessageId_fkey'
               AND conrelid = '"OCPPMessages"'::regclass
          ) THEN
            ALTER TABLE "OCPPMessages"
              ADD CONSTRAINT "OCPPMessages_requestMessageId_fkey"
              FOREIGN KEY ("requestMessageId") REFERENCES "OCPPMessages"(id)
              ON UPDATE CASCADE ON DELETE SET NULL;
          END IF;
        END $$`);

      // CREATE OR REPLACE TRIGGER is idempotent (PG14+).
      await raw(`
        CREATE OR REPLACE TRIGGER "trg_ocpp_correlate_response"
          BEFORE INSERT ON "OCPPMessages"
          FOR EACH ROW
          WHEN (
            NEW."correlationId" IS NOT NULL
            AND NEW."requestMessageId" IS NULL
            AND NEW."type" IN (3, 4)
          )
          EXECUTE FUNCTION ocpp_correlate_response()`);
      await raw(`
        CREATE OR REPLACE TRIGGER "trg_ocpp_correlate_call"
          AFTER INSERT ON "OCPPMessages"
          FOR EACH ROW
          WHEN (NEW."correlationId" IS NOT NULL AND NEW."type" = 2)
          EXECUTE FUNCTION ocpp_correlate_call()`);
      await raw(`
        CREATE OR REPLACE TRIGGER "trigger_populate_ocppmessages_station_id"
          BEFORE INSERT OR UPDATE ON "OCPPMessages"
          FOR EACH ROW WHEN (NEW."stationId" IS NULL)
          EXECUTE FUNCTION populate_station_id()`);

      await raw(`DROP PROCEDURE IF EXISTS rotate_ocpp_messages_partitions(int, int, boolean)`);
    });
  },
};
