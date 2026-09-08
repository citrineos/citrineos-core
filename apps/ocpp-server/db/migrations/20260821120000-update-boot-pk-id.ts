// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface, QueryTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Fire-and-forget raw SQL inside the transaction.
      const q = (sql: string, replacements?: Record<string, any>) =>
        queryInterface.sequelize.query(sql, {
          transaction,
          replacements,
          type: QueryTypes.RAW,
        });

      // SELECT inside the transaction; returns the row array directly.
      const qSelect = <T = any>(sql: string, replacements?: Record<string, any>): Promise<T[]> =>
        queryInterface.sequelize.query(sql, {
          transaction,
          replacements,
          type: QueryTypes.SELECT,
        }) as Promise<T[]>;

      // Column name → data type, read through the transaction connection so a
      // single-connection pool cannot deadlock.
      const describeTable = async (table: string): Promise<Record<string, string>> => {
        const rows = await qSelect<{ column: string; type: string }>(
          `SELECT column_name AS "column", data_type AS "type"
             FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name   = :table`,
          { table },
        );
        const desc: Record<string, string> = {};
        for (const row of rows) {
          desc[row.column] = row.type;
        }
        return desc;
      };

      const dropConstraintIfExists = (table: string, name: string) =>
        q(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}"`);

      // Drop every FK on `table` that uses `column`, by inspecting
      // information_schema so that any constraint name is handled.
      const dropFkByColumn = async (table: string, column: string) => {
        const rows = await qSelect<{ constraint_name: string }>(
          `SELECT tc.constraint_name
             FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
               ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema    = kcu.table_schema
            WHERE tc.table_schema    = 'public'
              AND tc.table_name      = :table
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name    = :column`,
          { table, column },
        );
        for (const row of rows) {
          await dropConstraintIfExists(table, row.constraint_name);
        }
      };

      // The whole migration is one transaction, so the only states to handle are
      // "not yet applied" and "fully applied" — a varchar "id" means the former.
      const bootsBefore = await describeTable('Boots');
      const notYetApplied = (bootsBefore['id'] ?? '').includes('char');

      if (notYetApplied) {
        // ── Step 1: Release the VariableAttributes → Boots relationship ───────
        // The FK points at the varchar primary key we are about to replace.
        await dropFkByColumn('VariableAttributes', 'bootConfigId');

        // ── Step 2: Park the old varchar key so the joins below can use it ────
        // It is dropped again at the end; the station owns this value.
        await q(`ALTER TABLE "Boots" RENAME COLUMN "id" TO "ocppConnectionNameTmp"`);

        // ── Step 3: New serial primary key ───────────────────────────────────
        await dropConstraintIfExists('Boots', 'Boots_pkey');
        // ADD COLUMN … SERIAL backfills existing rows from the new sequence.
        await q(`ALTER TABLE "Boots" ADD COLUMN "id" SERIAL`);
        await q(`ALTER TABLE "Boots" ADD PRIMARY KEY ("id")`);

        // ── Step 4: Resolve each boot record to its charging station ──────────
        await q(`ALTER TABLE "Boots" ADD COLUMN "stationId" INTEGER`);
        await q(
          `UPDATE "Boots" b
              SET "stationId" = cs."id"
             FROM "ChargingStations" cs
            WHERE cs."ocppConnectionName" = b."ocppConnectionNameTmp"
              AND cs."tenantId"           = b."tenantId"`,
        );

        // ── Step 5: Refuse boot records with no charging station ──────────────
        // stationId is NOT NULL, so these cannot be represented. Deleting them
        // is not ours to decide — they may be deliberately pre-provisioned config.
        const orphans = await qSelect<{ name: string; tenantId: number }>(
          `SELECT "ocppConnectionNameTmp" AS name, "tenantId"
             FROM "Boots"
            WHERE "stationId" IS NULL
            ORDER BY "tenantId", "ocppConnectionNameTmp"`,
        );
        if (orphans.length > 0) {
          const listed = orphans.slice(0, 20).map((o) => `${o.name} (tenant ${o.tenantId})`);
          const omitted = orphans.length - listed.length;
          throw new Error(
            `Data integrity error: ${orphans.length} row(s) in "Boots" reference a charging ` +
              `station that does not exist: ${listed.join(', ')}` +
              `${omitted > 0 ? `, and ${omitted} more` : ''}. ` +
              `Create the missing ChargingStations, or delete these boot records, ` +
              `then re-run this migration.`,
          );
        }

        // ── Step 6: Remap VariableAttributes.bootConfigId varchar → integer ───
        await q(`ALTER TABLE "VariableAttributes" ADD COLUMN "bootConfigIdInt" INTEGER`);
        await q(
          `UPDATE "VariableAttributes" va
              SET "bootConfigIdInt" = b."id"
             FROM "Boots" b
            WHERE b."ocppConnectionNameTmp" = va."bootConfigId"
              AND b."tenantId"              = va."tenantId"`,
        );
        await q(`ALTER TABLE "VariableAttributes" DROP COLUMN "bootConfigId"`);
        await q(
          `ALTER TABLE "VariableAttributes" RENAME COLUMN "bootConfigIdInt" TO "bootConfigId"`,
        );

        // ── Step 7: The station now owns the connection name ──────────────────
        await q(`ALTER TABLE "Boots" DROP COLUMN "ocppConnectionNameTmp"`);
      }

      // ── Constraints — applied unconditionally so a re-run is a no-op ────────
      await q(`ALTER TABLE "Boots" ALTER COLUMN "stationId" SET NOT NULL`);

      await dropConstraintIfExists('Boots', 'Boots_stationId_fkey');
      await q(
        `ALTER TABLE "Boots"
           ADD CONSTRAINT "Boots_stationId_fkey"
           FOREIGN KEY ("stationId") REFERENCES "ChargingStations"("id")
           ON UPDATE CASCADE ON DELETE CASCADE`,
      );

      // One boot record per charging station.
      await dropConstraintIfExists('Boots', 'Boots_stationId_key');
      await q(`ALTER TABLE "Boots" ADD CONSTRAINT "Boots_stationId_key" UNIQUE ("stationId")`);

      await dropConstraintIfExists('VariableAttributes', 'VariableAttributes_bootConfigId_fkey');
      await q(
        `ALTER TABLE "VariableAttributes"
           ADD CONSTRAINT "VariableAttributes_bootConfigId_fkey"
           FOREIGN KEY ("bootConfigId") REFERENCES "Boots"("id")
           ON UPDATE CASCADE ON DELETE SET NULL`,
      );
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string, replacements?: Record<string, any>) =>
        queryInterface.sequelize.query(sql, {
          transaction,
          replacements,
          type: QueryTypes.RAW,
        });

      const dropConstraintIfExists = (table: string, name: string) =>
        q(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}"`);

      // ── VariableAttributes.bootConfigId integer → varchar ───────────────────
      await dropConstraintIfExists('VariableAttributes', 'VariableAttributes_bootConfigId_fkey');
      await q(
        `ALTER TABLE "VariableAttributes" ADD COLUMN IF NOT EXISTS "bootConfigIdStr" VARCHAR(255)`,
      );
      await q(
        `UPDATE "VariableAttributes" va
            SET "bootConfigIdStr" = cs."ocppConnectionName"
           FROM "Boots" b
           JOIN "ChargingStations" cs ON cs."id" = b."stationId"
          WHERE b."id" = va."bootConfigId"`,
      );
      await q(`ALTER TABLE "VariableAttributes" DROP COLUMN IF EXISTS "bootConfigId"`);
      await q(`ALTER TABLE "VariableAttributes" RENAME COLUMN "bootConfigIdStr" TO "bootConfigId"`);

      // ── Boots back to the varchar primary key, recovered from the station ───
      // Note: the old primary key was global, so this fails if two tenants have
      // boot records for charging stations that share a connection name — state
      // the pre-migration schema could not represent in the first place.
      await q(`ALTER TABLE "Boots" ADD COLUMN IF NOT EXISTS "ocppConnectionName" VARCHAR(255)`);
      await q(
        `UPDATE "Boots" b
            SET "ocppConnectionName" = cs."ocppConnectionName"
           FROM "ChargingStations" cs
          WHERE cs."id" = b."stationId"`,
      );

      await dropConstraintIfExists('Boots', 'Boots_stationId_key');
      await dropConstraintIfExists('Boots', 'Boots_stationId_fkey');
      await q(`ALTER TABLE "Boots" DROP COLUMN IF EXISTS "stationId"`);

      await dropConstraintIfExists('Boots', 'Boots_pkey');
      await q(`ALTER TABLE "Boots" DROP COLUMN IF EXISTS "id"`);
      await q(`ALTER TABLE "Boots" RENAME COLUMN "ocppConnectionName" TO "id"`);
      await q(`ALTER TABLE "Boots" ALTER COLUMN "id" SET NOT NULL`);
      await q(`ALTER TABLE "Boots" ADD PRIMARY KEY ("id")`);

      await q(
        `ALTER TABLE "VariableAttributes"
           ADD CONSTRAINT "VariableAttributes_bootConfigId_fkey"
           FOREIGN KEY ("bootConfigId") REFERENCES "Boots"("id")
           ON UPDATE CASCADE ON DELETE SET NULL`,
      );
    });
  },
};
