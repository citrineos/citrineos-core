// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface, QueryTypes, Transaction } from 'sequelize';

/**
 * Converts "OCPPMessages" to a weekly range-partitioned table with a rolling retention window.
 *
 * The table is the largest in the system (~127M rows, ~130 GB) and its retention requirement is two
 * weeks, so the migration is built to avoid rewriting it. A staging table is created, filled with
 * only the rows inside the retention window, indexed, and then swapped in by rename. The original
 * heap is never written to — it is only read, under ACCESS SHARE — and survives as
 * "OCPPMessages_old" so it can be archived and dropped out of band. ACCESS EXCLUSIVE is taken once,
 * at the rename, and held for the few catalog writes that follow.
 *
 * Rows are selected by primary-key watermark rather than by "createdAt", because there is no index
 * on "createdAt": a createdAt predicate would sequentially scan the entire heap. The watermark is
 * found by binary search over the primary key and then biased downward by ID_MARGIN, because id
 * order and "createdAt" order can disagree by the width of a concurrent transaction and a row
 * missed here would be lost when the old heap is dropped. The straggler check refuses to proceed if
 * that margin turns out to be too small.
 *
 * Three constraints follow from partitioning and are reflected in the models:
 *
 * - The primary key becomes the composite (id, "createdAt"); the partition key has to be in it.
 * - OCPPMessages_requestMessageId_fkey cannot be recreated, because a foreign key must target a
 *   complete unique key and (id) alone is no longer one. requestMessageId becomes a soft reference
 *   maintained solely by ocpp_correlate_response()/ocpp_correlate_call().
 * - No DEFAULT partition. It would swallow future-dated rows, block DETACH ... CONCURRENTLY, and
 *   force a scan of itself every time a new weekly partition is created. The oldest partition uses
 *   MINVALUE instead, which also absorbs the pre-cutoff rows the watermark margin pulls in.
 *
 * NOTE: this provisions WEEKS_AHEAD week(s) beyond the current one. With no DEFAULT partition,
 * inserts fail once that runway is exhausted. rotate_ocpp_messages_partitions() is created here for
 * that purpose but is NOT scheduled — it must be called periodically (pg_cron or an application
 * job) before the runway expires.
 *
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
  "stationId", type, payload, raw`;

/** Same list, qualified for the catch-up's anti-join against the new table. */
const COLUMNS_QUALIFIED = `
  o.id, o."ocppConnectionName", o."correlationId", o.origin, o.protocol, o.action,
  o."timestamp", o."createdAt", o."updatedAt", o."tenantId", o."requestMessageId",
  o."stationId", o.type, o.payload, o.raw`;

/**
 * Largest id whose "createdAt" precedes the cutoff, minus ID_MARGIN.
 *
 * Probes the nearest EXISTING id at or above each midpoint: the key space has gaps, and testing a
 * single id and searching downward on a miss would move the upper bound past the real boundary.
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
  if (!bounds[0]?.lo) {
    throw new Error('OCPPMessages is empty — refusing to guess a watermark');
  }

  let lo = Number(bounds[0].lo);
  let hi = Number(bounds[0].hi);
  let watermark = lo - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const probe = await queryInterface.sequelize.query<{ id: string; createdAt: Date }>(
      `SELECT id::text AS id, "createdAt" FROM "OCPPMessages" WHERE id >= :mid ORDER BY id LIMIT 1`,
      { transaction, type: QueryTypes.SELECT, replacements: { mid } },
    );

    if (probe.length === 0) {
      hi = mid - 1;
    } else if (new Date(probe[0].createdAt) < new Date(cutoff)) {
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
          WHERE id > :low AND id <= :watermark AND "createdAt" >= :cutoff`,
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
          payload              jsonb,
          raw                  text NOT NULL,
          PRIMARY KEY (id, "createdAt")
        ) PARTITION BY RANGE ("createdAt")`);

      // The oldest partition uses MINVALUE so a late insert carrying an old "createdAt" — or a row
      // pulled in by the watermark margin — still has somewhere to land instead of erroring.
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

      // Validated against only the copied rows. requestMessageId gets no foreign key — see header.
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

      // Carry back anything written since the swap, then discard the partitioned table.
      await raw(`
        INSERT INTO "OCPPMessages_old" (${COLUMNS})
        SELECT ${COLUMNS} FROM "OCPPMessages" n
         WHERE NOT EXISTS (
           SELECT 1 FROM "OCPPMessages_old" o WHERE o.id = n.id)`);

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

      const [meta] = await queryInterface.sequelize.query<{ seq: string }>(
        `SELECT pg_get_serial_sequence('"OCPPMessages"', 'id') AS seq`,
        { transaction, type: QueryTypes.SELECT },
      );
      if (meta?.seq) {
        await raw(`ALTER SEQUENCE ${meta.seq} OWNED BY "OCPPMessages".id`);
      }

      // Restore the self-referencing foreign key the partitioned form could not carry.
      await raw(`
        ALTER TABLE "OCPPMessages"
          ADD CONSTRAINT "OCPPMessages_requestMessageId_fkey"
          FOREIGN KEY ("requestMessageId") REFERENCES "OCPPMessages"(id)
          ON UPDATE CASCADE ON DELETE SET NULL`);

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

      await raw(`DROP PROCEDURE IF EXISTS rotate_ocpp_messages_partitions(int, int, boolean)`);
    });
  },
};
