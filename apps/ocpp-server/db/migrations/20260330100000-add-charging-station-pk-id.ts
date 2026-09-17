// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { DataTypes, type ModelAttributeColumnOptions, QueryInterface, QueryTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // ── Everything below runs inside a single PostgreSQL transaction. ───────────
    // PostgreSQL treats DDL as transactional, so any failure causes a full
    // rollback — no partial state, no data loss.
    await queryInterface.sequelize.transaction(async (transaction) => {
      // ── Helpers ──────────────────────────────────────────────────────────────

      /** Fire-and-forget raw SQL inside the transaction. */
      const q = (sql: string, replacements?: Record<string, any>) =>
        queryInterface.sequelize.query(sql, {
          transaction,
          replacements,
          type: QueryTypes.RAW,
        });

      /** SELECT inside the transaction; returns the row array directly. */
      const qSelect = <T = any>(sql: string, replacements?: Record<string, any>): Promise<T[]> =>
        queryInterface.sequelize.query(sql, {
          transaction,
          replacements,
          type: QueryTypes.SELECT,
        }) as Promise<T[]>;

      const addCol = (table: string, col: string, def: ModelAttributeColumnOptions) =>
        queryInterface.addColumn(table, col, def, { transaction } as any);

      /** Check which columns exist — uses the transaction connection to avoid
       *  deadlocking on a single-connection pool. */
      const describeTable = async (table: string): Promise<Record<string, any>> => {
        const rows = await qSelect<{ Field: string }>(
          `SELECT column_name AS "Field"
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name   = :table`,
          { table },
        );
        const desc: Record<string, any> = {};
        for (const row of rows) {
          desc[(row as any).Field] = true;
        }
        return desc;
      };

      const dropConstraintIfExists = (table: string, name: string) =>
        q(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}"`);

      const dropIndexIfExists = (name: string) => q(`DROP INDEX IF EXISTS "${name}"`);

      /**
       * Drop every FK on `table` that uses `column`, by inspecting
       * information_schema so that we handle any constraint name.
       */
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
          await q(
            `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${(row as any).constraint_name}"`,
          );
        }
      };

      /**
       * After UPDATE … SET stationPkId = cs.pkId, verify that every row with a
       * non-NULL stationId was matched.  A mismatch means the database already
       * had a referential-integrity problem; we refuse to proceed rather than
       * silently lose the relationship.
       */
      const validateNoOrphans = async (table: string) => {
        const [row] = await qSelect<{ cnt: string }>(
          `SELECT COUNT(*) AS cnt
           FROM "${table}"
           WHERE "stationId" IS NOT NULL
             AND "stationPkId" IS NULL`,
        );
        const cnt = parseInt((row as any).cnt, 10);
        if (cnt > 0) {
          throw new Error(
            `Data integrity error: ${cnt} row(s) in "${table}" have a non-NULL ` +
              `stationId that could not be matched to any ChargingStation. ` +
              `Resolve these orphaned rows before running this migration.`,
          );
        }
      };

      // ── Step 1: Drop ALL FK constraints on child tables ───────────────────────
      // Covers both the original stationId_fkey constraints AND any
      // stationPkId_fkey constraints left behind by a previous partial run.
      const allChildFks: [string, string][] = [
        // ── original stationId_fkey constraints ──────────────────────────────
        ['Transactions', 'Transactions_stationId_fkey'],
        ['ChargingStationNetworkProfiles', 'ChargingStationNetworkProfiles_stationId_fkey'],
        ['ChargingStationSequences', 'ChargingStationSequences_stationId_fkey'],
        ['Connectors', 'Connectors_stationId_fkey'],
        ['Evses', 'Evses_stationId_fkey'],
        ['StatusNotifications', 'StatusNotifications_stationId_fkey'],
        ['LatestStatusNotifications', 'LatestStatusNotifications_stationId_fkey'],
        ['VariableAttributes', 'VariableAttributes_stationId_fkey'],
        ['SetNetworkProfiles', 'SetNetworkProfiles_stationId_fkey'],
        ['OCPPMessages', 'OCPPMessages_stationId_fkey'],
        ['InstalledCertificates', 'InstalledCertificates_stationId_fkey'],
        ['EventData', 'EventData_stationId_fkey'],
        ['VariableMonitorings', 'VariableMonitorings_stationId_fkey'],
        ['InstallCertificateAttempts', 'InstallCertificateAttempts_stationId_fkey'],
        ['DeleteCertificateAttempts', 'DeleteCertificateAttempts_stationId_fkey'],
        ['ChargingStationSecurityInfos', 'ChargingStationSecurityInfos_stationId_fkey'],
        // ── stationPkId_fkey constraints (left from a previous partial run) ──
        ['Evses', 'Evses_stationPkId_fkey'],
        ['Connectors', 'Connectors_stationPkId_fkey'],
        ['Transactions', 'Transactions_stationPkId_fkey'],
        ['ChargingStationNetworkProfiles', 'ChargingStationNetworkProfiles_stationPkId_fkey'],
        ['ChargingStationSequences', 'ChargingStationSequences_stationPkId_fkey'],
        ['StatusNotifications', 'StatusNotifications_stationPkId_fkey'],
        ['LatestStatusNotifications', 'LatestStatusNotifications_stationPkId_fkey'],
        ['VariableAttributes', 'VariableAttributes_stationPkId_fkey'],
        ['SetNetworkProfiles', 'SetNetworkProfiles_stationPkId_fkey'],
        ['OCPPMessages', 'OCPPMessages_stationPkId_fkey'],
        ['InstalledCertificates', 'InstalledCertificates_stationPkId_fkey'],
        ['EventData', 'EventData_stationPkId_fkey'],
        ['VariableMonitorings', 'VariableMonitorings_stationPkId_fkey'],
        ['InstallCertificateAttempts', 'InstallCertificateAttempts_stationPkId_fkey'],
        ['DeleteCertificateAttempts', 'DeleteCertificateAttempts_stationPkId_fkey'],
        ['ChargingStationSecurityInfos', 'ChargingStationSecurityInfos_stationPkId_fkey'],
      ];

      for (const [table, fkName] of allChildFks) {
        await dropConstraintIfExists(table, fkName);
      }

      // ── Step 2: Add pkId to ChargingStations (safe for tables with data) ──────
      //
      // Adding a NOT NULL column without a DEFAULT to a non-empty table fails in
      // PostgreSQL.  Safe order:
      //   a) add as nullable
      //   b) create sequence & attach as default
      //   c) fill NULL pkIds (all rows on a clean run, leftover rows on re-run)
      //   d) advance sequence past the current max
      //   e) enforce NOT NULL

      const csDesc = await describeTable('ChargingStations');
      if (!csDesc['pkId']) {
        await addCol('ChargingStations', 'pkId', {
          type: DataTypes.INTEGER,
          allowNull: true, // populated below before setting NOT NULL
        });
      }

      await q(`CREATE SEQUENCE IF NOT EXISTS "ChargingStations_pkId_seq"`);
      await q(
        `ALTER TABLE "ChargingStations"
           ALTER COLUMN "pkId" SET DEFAULT nextval('"ChargingStations_pkId_seq"')`,
      );

      // Assign a unique integer to every row that doesn't have one yet.
      await q(
        `UPDATE "ChargingStations"
           SET "pkId" = nextval('"ChargingStations_pkId_seq"')
           WHERE "pkId" IS NULL`,
      );

      // Advance the sequence past the current maximum so future inserts are safe.
      await q(
        `SELECT setval(
           '"ChargingStations_pkId_seq"',
           COALESCE((SELECT MAX("pkId") FROM "ChargingStations"), 1)
         )`,
      );

      // Now every row has a value — enforce NOT NULL.
      await q(`ALTER TABLE "ChargingStations" ALTER COLUMN "pkId" SET NOT NULL`);

      // ── Step 3: Swap the primary key ─────────────────────────────────────────

      await q(`ALTER TABLE "ChargingStations" DROP CONSTRAINT IF EXISTS "ChargingStations_pkey"`);
      await q(`ALTER TABLE "ChargingStations" ADD PRIMARY KEY ("pkId")`);

      await dropConstraintIfExists('ChargingStations', 'ChargingStations_id_tenantId_key');
      await q(
        `ALTER TABLE "ChargingStations"
           ADD CONSTRAINT "ChargingStations_id_tenantId_key" UNIQUE (id, "tenantId")`,
      );

      // ── Step 4: Migrate each child table ─────────────────────────────────────
      //
      // For every child table:
      //   1. Add stationPkId (nullable) if not present
      //   2. Populate it by joining to ChargingStations
      //   3. Validate — fail if any row with stationId couldn't be matched
      //   4. Drop old stationId FK
      //   5. Add new stationPkId FK

      const migrateChildTable = async (table: string, onDeleteRule = 'SET NULL') => {
        const desc = await describeTable(table);
        if (!desc['stationPkId']) {
          await addCol(table, 'stationPkId', { type: DataTypes.INTEGER, allowNull: true });
        }

        await q(
          `UPDATE "${table}" t
             SET "stationPkId" = cs."pkId"
             FROM "ChargingStations" cs
            WHERE cs.id        = t."stationId"
              AND cs."tenantId" = t."tenantId"`,
        );

        // Fail fast before we drop the old FK if any relationship can't be resolved.
        await validateNoOrphans(table);

        await dropFkByColumn(table, 'stationId');

        const fkName = `${table}_stationPkId_fkey`;
        await dropConstraintIfExists(table, fkName);
        await q(
          `ALTER TABLE "${table}"
             ADD CONSTRAINT "${fkName}"
             FOREIGN KEY ("stationPkId")
             REFERENCES "ChargingStations"("pkId")
             ON UPDATE CASCADE ON DELETE ${onDeleteRule}`,
        );
      };

      // Evses
      await migrateChildTable('Evses', 'CASCADE');
      await dropConstraintIfExists('Evses', 'stationId_evseTypeId');
      await dropConstraintIfExists('Evses', 'stationPkId_evseTypeId');
      await q(
        `ALTER TABLE "Evses" ADD CONSTRAINT "stationPkId_evseTypeId" UNIQUE ("stationPkId", "evseTypeId")`,
      );

      // Connectors
      await migrateChildTable('Connectors', 'CASCADE');
      await dropConstraintIfExists('Connectors', 'stationId_connectorId');
      await dropConstraintIfExists('Connectors', 'Connectors_stationId_connectorId_key');
      await dropConstraintIfExists('Connectors', 'stationPkId_connectorId');
      await q(
        `ALTER TABLE "Connectors" ADD CONSTRAINT "stationPkId_connectorId" UNIQUE ("stationPkId", "connectorId")`,
      );

      // Transactions
      await migrateChildTable('Transactions', 'SET NULL');
      await dropConstraintIfExists('Transactions', 'stationId_transactionId');
      await dropConstraintIfExists('Transactions', 'Transactions_stationId_transactionId_key');
      await dropConstraintIfExists('Transactions', 'stationPkId_transactionId');
      await q(
        `ALTER TABLE "Transactions" ADD CONSTRAINT "stationPkId_transactionId" UNIQUE ("stationPkId", "transactionId")`,
      );

      // ChargingStationNetworkProfiles — inline because it also needs its own
      // PK and extra unique constraints cleaned up.
      {
        const desc = await describeTable('ChargingStationNetworkProfiles');
        if (!desc['stationPkId']) {
          await addCol('ChargingStationNetworkProfiles', 'stationPkId', {
            type: DataTypes.INTEGER,
            allowNull: true,
          });
        }
        await q(
          `UPDATE "ChargingStationNetworkProfiles" t
             SET "stationPkId" = cs."pkId"
             FROM "ChargingStations" cs
            WHERE cs.id        = t."stationId"
              AND cs."tenantId" = t."tenantId"`,
        );
        await validateNoOrphans('ChargingStationNetworkProfiles');
        await dropFkByColumn('ChargingStationNetworkProfiles', 'stationId');

        await dropConstraintIfExists(
          'ChargingStationNetworkProfiles',
          'ChargingStationNetworkProfiles_pkey',
        );
        // The stationId variant is exactly 63 chars — no truncation.
        await dropConstraintIfExists(
          'ChargingStationNetworkProfiles',
          'ChargingStationNetworkProfile_stationId_websocketServerConf_key',
        );
        // The stationPkId variant is 65 chars; PostgreSQL truncates stored names
        // to 63 chars, so we must drop both spellings to be safe.
        await dropConstraintIfExists(
          'ChargingStationNetworkProfiles',
          'ChargingStationNetworkProfile_stationPkId_websocketServerConf_key',
        );
        await dropConstraintIfExists(
          'ChargingStationNetworkProfiles',
          'ChargingStationNetworkProfile_stationPkId_websocketServerConf_k',
        );
        await dropConstraintIfExists(
          'ChargingStationNetworkProfiles',
          'stationId_configurationSlot',
        );
        await dropConstraintIfExists(
          'ChargingStationNetworkProfiles',
          'stationPkId_configurationSlot',
        );

        await q(
          `ALTER TABLE "ChargingStationNetworkProfiles"
             ADD CONSTRAINT "ChargingStationNetworkProfiles_stationPkId_fkey"
             FOREIGN KEY ("stationPkId")
             REFERENCES "ChargingStations"("pkId")
             ON UPDATE CASCADE ON DELETE CASCADE`,
        );
        await q(
          `ALTER TABLE "ChargingStationNetworkProfiles"
             ADD CONSTRAINT "stationPkId_configurationSlot"
             UNIQUE ("stationPkId", "configurationSlot")`,
        );
        // Use a name that stays within PostgreSQL's 63-char identifier limit.
        await q(
          `ALTER TABLE "ChargingStationNetworkProfiles"
             ADD CONSTRAINT "CSNP_stationPkId_websocketServerConfigId_key"
             UNIQUE ("stationPkId", "websocketServerConfigId")`,
        );
      }

      // ChargingStationSequences
      await migrateChildTable('ChargingStationSequences', 'CASCADE');
      await dropConstraintIfExists('ChargingStationSequences', 'stationId_type');
      await dropConstraintIfExists(
        'ChargingStationSequences',
        'ChargingStationSequences_stationId_type_key',
      );
      await dropConstraintIfExists('ChargingStationSequences', 'stationPkId_type');
      await q(
        `ALTER TABLE "ChargingStationSequences" ADD CONSTRAINT "stationPkId_type" UNIQUE ("stationPkId", type)`,
      );

      await migrateChildTable('StatusNotifications', 'SET NULL');
      await migrateChildTable('LatestStatusNotifications', 'SET NULL');

      // VariableAttributes
      await migrateChildTable('VariableAttributes', 'CASCADE');
      await dropIndexIfExists('variable_attributes_station_id');
      await dropConstraintIfExists('VariableAttributes', 'stationId_type_variableId_componentId');
      await dropConstraintIfExists(
        'VariableAttributes',
        'VariableAttributes_stationId_type_variableId_componentId_key',
      );
      await dropConstraintIfExists('VariableAttributes', 'stationPkId_type_variableId_componentId');
      await q(
        `ALTER TABLE "VariableAttributes"
           ADD CONSTRAINT "stationPkId_type_variableId_componentId"
           UNIQUE ("stationPkId", type, "variableId", "componentId")`,
      );
      await q(
        `CREATE UNIQUE INDEX IF NOT EXISTS "variable_attributes_stationPkId"
           ON "VariableAttributes" ("stationPkId")
           WHERE (type IS NULL AND "variableId" IS NULL AND "componentId" IS NULL)`,
      );

      // SetNetworkProfiles
      {
        const desc = await describeTable('SetNetworkProfiles');
        if (!desc['stationPkId']) {
          await addCol('SetNetworkProfiles', 'stationPkId', {
            type: DataTypes.INTEGER,
            allowNull: true,
          });
        }
        await q(
          `UPDATE "SetNetworkProfiles" t
             SET "stationPkId" = cs."pkId"
             FROM "ChargingStations" cs
            WHERE cs.id = t."stationId" AND cs."tenantId" = t."tenantId"`,
        );
        await validateNoOrphans('SetNetworkProfiles');
        await dropFkByColumn('SetNetworkProfiles', 'stationId');
        await dropConstraintIfExists('SetNetworkProfiles', 'SetNetworkProfiles_stationPkId_fkey');
        await q(
          `ALTER TABLE "SetNetworkProfiles"
             ADD CONSTRAINT "SetNetworkProfiles_stationPkId_fkey"
             FOREIGN KEY ("stationPkId") REFERENCES "ChargingStations"("pkId")
             ON UPDATE CASCADE ON DELETE SET NULL`,
        );
      }

      // OCPPMessages
      {
        const desc = await describeTable('OCPPMessages');
        if (!desc['stationPkId']) {
          await addCol('OCPPMessages', 'stationPkId', { type: DataTypes.INTEGER, allowNull: true });
        }
        await q(
          `UPDATE "OCPPMessages" t
             SET "stationPkId" = cs."pkId"
             FROM "ChargingStations" cs
            WHERE cs.id = t."stationId" AND cs."tenantId" = t."tenantId"`,
        );
        await validateNoOrphans('OCPPMessages');
        await dropFkByColumn('OCPPMessages', 'stationId');
        await dropConstraintIfExists('OCPPMessages', 'OCPPMessages_stationPkId_fkey');
        await q(
          `ALTER TABLE "OCPPMessages"
             ADD CONSTRAINT "OCPPMessages_stationPkId_fkey"
             FOREIGN KEY ("stationPkId") REFERENCES "ChargingStations"("pkId")
             ON UPDATE CASCADE ON DELETE SET NULL`,
        );
      }

      // InstalledCertificates
      {
        const desc = await describeTable('InstalledCertificates');
        if (!desc['stationPkId']) {
          await addCol('InstalledCertificates', 'stationPkId', {
            type: DataTypes.INTEGER,
            allowNull: true,
          });
        }
        await q(
          `UPDATE "InstalledCertificates" t
             SET "stationPkId" = cs."pkId"
             FROM "ChargingStations" cs
            WHERE cs.id = t."stationId" AND cs."tenantId" = t."tenantId"`,
        );
        await validateNoOrphans('InstalledCertificates');
        await dropFkByColumn('InstalledCertificates', 'stationId');
        await dropConstraintIfExists(
          'InstalledCertificates',
          'InstalledCertificates_stationPkId_fkey',
        );
        await q(
          `ALTER TABLE "InstalledCertificates"
             ADD CONSTRAINT "InstalledCertificates_stationPkId_fkey"
             FOREIGN KEY ("stationPkId") REFERENCES "ChargingStations"("pkId")
             ON UPDATE CASCADE ON DELETE CASCADE`,
        );
      }

      // EventData
      {
        const desc = await describeTable('EventData');
        if (!desc['stationPkId']) {
          await addCol('EventData', 'stationPkId', { type: DataTypes.INTEGER, allowNull: true });
        }
        await q(
          `UPDATE "EventData" t
             SET "stationPkId" = cs."pkId"
             FROM "ChargingStations" cs
            WHERE cs.id = t."stationId" AND cs."tenantId" = t."tenantId"`,
        );
        await validateNoOrphans('EventData');
        await dropFkByColumn('EventData', 'stationId');
        await dropConstraintIfExists('EventData', 'EventData_stationPkId_fkey');
        await q(
          `ALTER TABLE "EventData"
             ADD CONSTRAINT "EventData_stationPkId_fkey"
             FOREIGN KEY ("stationPkId") REFERENCES "ChargingStations"("pkId")
             ON UPDATE CASCADE ON DELETE SET NULL`,
        );
      }

      // VariableMonitorings
      {
        const desc = await describeTable('VariableMonitorings');
        if (!desc['stationPkId']) {
          await addCol('VariableMonitorings', 'stationPkId', {
            type: DataTypes.INTEGER,
            allowNull: true,
          });
        }
        await q(
          `UPDATE "VariableMonitorings" t
             SET "stationPkId" = cs."pkId"
             FROM "ChargingStations" cs
            WHERE cs.id = t."stationId" AND cs."tenantId" = t."tenantId"`,
        );
        await validateNoOrphans('VariableMonitorings');
        await dropFkByColumn('VariableMonitorings', 'stationId');
        await dropConstraintIfExists('VariableMonitorings', 'VariableMonitorings_stationPkId_fkey');
        await q(
          `ALTER TABLE "VariableMonitorings"
             ADD CONSTRAINT "VariableMonitorings_stationPkId_fkey"
             FOREIGN KEY ("stationPkId") REFERENCES "ChargingStations"("pkId")
             ON UPDATE CASCADE ON DELETE SET NULL`,
        );
      }

      // InstallCertificateAttempts
      {
        const desc = await describeTable('InstallCertificateAttempts');
        if (!desc['stationPkId']) {
          await addCol('InstallCertificateAttempts', 'stationPkId', {
            type: DataTypes.INTEGER,
            allowNull: true,
          });
        }
        await q(
          `UPDATE "InstallCertificateAttempts" t
             SET "stationPkId" = cs."pkId"
             FROM "ChargingStations" cs
            WHERE cs.id = t."stationId" AND cs."tenantId" = t."tenantId"`,
        );
        await validateNoOrphans('InstallCertificateAttempts');
        await dropFkByColumn('InstallCertificateAttempts', 'stationId');
        await dropConstraintIfExists(
          'InstallCertificateAttempts',
          'InstallCertificateAttempts_stationPkId_fkey',
        );
        await q(
          `ALTER TABLE "InstallCertificateAttempts"
             ADD CONSTRAINT "InstallCertificateAttempts_stationPkId_fkey"
             FOREIGN KEY ("stationPkId") REFERENCES "ChargingStations"("pkId")
             ON UPDATE CASCADE ON DELETE SET NULL`,
        );
      }

      // DeleteCertificateAttempts
      {
        const desc = await describeTable('DeleteCertificateAttempts');
        if (!desc['stationPkId']) {
          await addCol('DeleteCertificateAttempts', 'stationPkId', {
            type: DataTypes.INTEGER,
            allowNull: true,
          });
        }
        await q(
          `UPDATE "DeleteCertificateAttempts" t
             SET "stationPkId" = cs."pkId"
             FROM "ChargingStations" cs
            WHERE cs.id = t."stationId" AND cs."tenantId" = t."tenantId"`,
        );
        await validateNoOrphans('DeleteCertificateAttempts');
        await dropFkByColumn('DeleteCertificateAttempts', 'stationId');
        await dropConstraintIfExists(
          'DeleteCertificateAttempts',
          'DeleteCertificateAttempts_stationPkId_fkey',
        );
        await q(
          `ALTER TABLE "DeleteCertificateAttempts"
             ADD CONSTRAINT "DeleteCertificateAttempts_stationPkId_fkey"
             FOREIGN KEY ("stationPkId") REFERENCES "ChargingStations"("pkId")
             ON UPDATE CASCADE ON DELETE SET NULL`,
        );
      }

      // ChargingStationSecurityInfos
      {
        const desc = await describeTable('ChargingStationSecurityInfos');
        if (!desc['stationPkId']) {
          await addCol('ChargingStationSecurityInfos', 'stationPkId', {
            type: DataTypes.INTEGER,
            allowNull: true,
          });
        }
        await q(
          `UPDATE "ChargingStationSecurityInfos" t
             SET "stationPkId" = cs."pkId"
             FROM "ChargingStations" cs
            WHERE cs.id = t."stationId" AND cs."tenantId" = t."tenantId"`,
        );
        await validateNoOrphans('ChargingStationSecurityInfos');
        await dropFkByColumn('ChargingStationSecurityInfos', 'stationId');
        await dropConstraintIfExists(
          'ChargingStationSecurityInfos',
          'ChargingStationSecurityInfos_stationPkId_fkey',
        );
        await q(
          `ALTER TABLE "ChargingStationSecurityInfos"
             ADD CONSTRAINT "ChargingStationSecurityInfos_stationPkId_fkey"
             FOREIGN KEY ("stationPkId") REFERENCES "ChargingStations"("pkId")
             ON UPDATE CASCADE ON DELETE SET NULL`,
        );
      }

      // ── Step 5: Widen unique constraints to include tenantId ──────────────────

      const dropOldUnique = async (table: string, ...names: string[]) => {
        for (const name of names) await dropConstraintIfExists(table, name);
      };

      // Constraint names in PostgreSQL are globally unique per schema (they are
      // backed by indexes).  Prefix every name with the table to avoid collisions.

      await dropOldUnique(
        'ChargingStationSecurityInfos',
        'ChargingStationSecurityInfos_stationId_key',
        'stationId_tenantId',
        'ChargingStationSecurityInfos_stationId_tenantId',
      );
      await q(
        `ALTER TABLE "ChargingStationSecurityInfos" ADD CONSTRAINT "ChargingStationSecurityInfos_stationId_tenantId" UNIQUE ("stationId", "tenantId")`,
      );

      await dropOldUnique(
        'Reservations',
        'stationId_id',
        'Reservations_id_stationId_key',
        'stationId_tenantId_id',
        'Reservations_stationId_tenantId_id',
      );
      await q(
        `ALTER TABLE "Reservations" ADD CONSTRAINT "Reservations_stationId_tenantId_id" UNIQUE ("stationId", "tenantId", id)`,
      );

      await dropOldUnique(
        'VariableMonitorings',
        'stationId_Id',
        'VariableMonitorings_stationId_id_key',
        'stationId_tenantId_Id',
        'VariableMonitorings_stationId_tenantId_id',
      );
      await q(
        `ALTER TABLE "VariableMonitorings" ADD CONSTRAINT "VariableMonitorings_stationId_tenantId_id" UNIQUE ("stationId", "tenantId", id)`,
      );

      await dropOldUnique(
        'MessageInfos',
        'stationId_id',
        'MessageInfos_stationId_id_key',
        'stationId_tenantId_id',
        'MessageInfos_stationId_tenantId_id',
      );
      await q(
        `ALTER TABLE "MessageInfos" ADD CONSTRAINT "MessageInfos_stationId_tenantId_id" UNIQUE ("stationId", "tenantId", id)`,
      );

      await dropOldUnique(
        'ChangeConfigurations',
        'stationId_key',
        'ChangeConfigurations_stationId_key_key',
        'stationId_tenantId_key',
        'ChangeConfigurations_stationId_tenantId_key',
      );
      await q(
        `ALTER TABLE "ChangeConfigurations" ADD CONSTRAINT "ChangeConfigurations_stationId_tenantId_key" UNIQUE ("stationId", "tenantId", key)`,
      );

      await dropOldUnique(
        'ChargingProfiles',
        'stationId_id',
        'ChargingProfiles_stationId_id_key',
        'stationId_tenantId_id',
        'ChargingProfiles_stationId_tenantId_id',
      );
      await q(
        `ALTER TABLE "ChargingProfiles" ADD CONSTRAINT "ChargingProfiles_stationId_tenantId_id" UNIQUE ("stationId", "tenantId", id)`,
      );

      await dropOldUnique(
        'ChargingSchedules',
        'stationId_id',
        'ChargingSchedules_stationId_id_key',
        'stationId_tenantId_id',
        'ChargingSchedules_stationId_tenantId_id',
      );
      await q(
        `ALTER TABLE "ChargingSchedules" ADD CONSTRAINT "ChargingSchedules_stationId_tenantId_id" UNIQUE ("stationId", "tenantId", id)`,
      );

      await dropOldUnique(
        'LocalListVersions',
        'LocalListVersions_stationId_key',
        'stationId_tenantId',
        'LocalListVersions_stationId_tenantId',
      );
      await q(
        `ALTER TABLE "LocalListVersions" ADD CONSTRAINT "LocalListVersions_stationId_tenantId" UNIQUE ("stationId", "tenantId")`,
      );

      await dropOldUnique(
        'EventData',
        'stationId_eventId',
        'EventData_stationId_eventId_key',
        'stationId_tenantId_eventId',
        'EventData_stationId_tenantId_eventId',
      );
      await q(
        `ALTER TABLE "EventData" ADD CONSTRAINT "EventData_stationId_tenantId_eventId" UNIQUE ("stationId", "tenantId", "eventId")`,
      );

      // ── Step 6: Create DB triggers to auto-populate stationPkId ─────────────
      //
      // Now that every child table has its stationPkId column, we create a
      // BEFORE INSERT OR UPDATE trigger on each one.  The trigger looks up the
      // ChargingStation.pkId from (stationId, tenantId) whenever stationPkId is
      // not already supplied, giving a DB-level safety net on top of the ORM
      // @BeforeCreate hooks defined on each model.
      //
      // Note: this used to live in a separate migration file
      // (20260330000000-charging-station-pk-id-triggers.ts) that ran *before*
      // the columns were added, so all trigger creations were silently skipped.
      // The trigger setup is now consolidated here, at the end of `up`, where
      // all stationPkId columns are guaranteed to exist.

      const allTablesWithStationPkId = [
        'Evses',
        'Connectors',
        'Transactions',
        'ChargingStationNetworkProfiles',
        'ChargingStationSequences',
        'StatusNotifications',
        'LatestStatusNotifications',
        'VariableAttributes',
        'SetNetworkProfiles',
        'OCPPMessages',
        'InstalledCertificates',
        'ChargingStationSecurityInfos',
        'VariableMonitorings',
        'EventData',
        'InstallCertificateAttempts',
        'DeleteCertificateAttempts',
      ];

      await q(`
        CREATE OR REPLACE FUNCTION populate_station_pk_id()
        RETURNS TRIGGER AS $$
        BEGIN
          SELECT "pkId" INTO NEW."stationPkId"
          FROM "ChargingStations"
          WHERE "id" = NEW."stationId" AND "tenantId" = NEW."tenantId";

          IF NEW."stationPkId" IS NULL THEN
            RAISE EXCEPTION 'No ChargingStation found with stationId=% and tenantId=%',
                           NEW."stationId", NEW."tenantId";
          END IF;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      for (const tableName of allTablesWithStationPkId) {
        const triggerName = `trigger_populate_${tableName.toLowerCase()}_station_pk_id`;
        await q(`DROP TRIGGER IF EXISTS "${triggerName}" ON "${tableName}"`);
        await q(`
          CREATE TRIGGER "${triggerName}"
          BEFORE INSERT OR UPDATE ON "${tableName}"
          FOR EACH ROW
          WHEN (NEW."stationPkId" IS NULL)
          EXECUTE FUNCTION populate_station_pk_id()
        `);
      }

      console.log('Migration 20260330100000-add-charging-station-pk-id completed successfully.');
    }); // ── end transaction ──────────────────────────────────────────────────────
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const q = (sql: string) =>
        queryInterface.sequelize.query(sql, { transaction, type: QueryTypes.RAW });

      // ── Drop triggers and function first ──────────────────────────────────────
      // Must happen before we remove the stationPkId columns they reference.
      const allTablesWithStationPkId = [
        'Evses',
        'Connectors',
        'Transactions',
        'ChargingStationNetworkProfiles',
        'ChargingStationSequences',
        'StatusNotifications',
        'LatestStatusNotifications',
        'VariableAttributes',
        'SetNetworkProfiles',
        'OCPPMessages',
        'InstalledCertificates',
        'ChargingStationSecurityInfos',
        'VariableMonitorings',
        'EventData',
        'InstallCertificateAttempts',
        'DeleteCertificateAttempts',
      ];
      for (const tableName of allTablesWithStationPkId) {
        const triggerName = `trigger_populate_${tableName.toLowerCase()}_station_pk_id`;
        await q(`DROP TRIGGER IF EXISTS "${triggerName}" ON "${tableName}"`);
      }
      await q(`DROP FUNCTION IF EXISTS populate_station_pk_id()`);
      // ─────────────────────────────────────────────────────────────────────────

      const qSelect = <T = any>(sql: string, replacements?: Record<string, any>): Promise<T[]> =>
        queryInterface.sequelize.query(sql, {
          transaction,
          replacements,
          type: QueryTypes.SELECT,
        }) as Promise<T[]>;

      const dropFkIfExists = (table: string, name: string) =>
        q(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${name}"`);

      /** Check which columns exist — uses the transaction connection. */
      const describeTable = async (table: string): Promise<Record<string, any>> => {
        const rows = await qSelect<{ Field: string }>(
          `SELECT column_name AS "Field"
           FROM information_schema.columns
           WHERE table_schema = 'public'
             AND table_name   = :table`,
          { table },
        );
        const desc: Record<string, any> = {};
        for (const row of rows) {
          desc[(row as any).Field] = true;
        }
        return desc;
      };

      const childTables: [string, string][] = [
        ['Evses', 'Evses_stationPkId_fkey'],
        ['Connectors', 'Connectors_stationPkId_fkey'],
        ['Transactions', 'Transactions_stationPkId_fkey'],
        ['ChargingStationNetworkProfiles', 'ChargingStationNetworkProfiles_stationPkId_fkey'],
        ['ChargingStationSequences', 'ChargingStationSequences_stationPkId_fkey'],
        ['StatusNotifications', 'StatusNotifications_stationPkId_fkey'],
        ['LatestStatusNotifications', 'LatestStatusNotifications_stationPkId_fkey'],
        ['VariableAttributes', 'VariableAttributes_stationPkId_fkey'],
        ['SetNetworkProfiles', 'SetNetworkProfiles_stationPkId_fkey'],
        ['OCPPMessages', 'OCPPMessages_stationPkId_fkey'],
        ['InstalledCertificates', 'InstalledCertificates_stationPkId_fkey'],
        ['EventData', 'EventData_stationPkId_fkey'],
        ['VariableMonitorings', 'VariableMonitorings_stationPkId_fkey'],
        ['InstallCertificateAttempts', 'InstallCertificateAttempts_stationPkId_fkey'],
        ['DeleteCertificateAttempts', 'DeleteCertificateAttempts_stationPkId_fkey'],
        ['ChargingStationSecurityInfos', 'ChargingStationSecurityInfos_stationPkId_fkey'],
      ];

      // Drop unique constraints / indexes that include stationPkId BEFORE
      // removing the column — PostgreSQL's DROP COLUMN (without CASCADE) will
      // fail if the column is still referenced by a multi-column constraint.
      await q(
        `ALTER TABLE "Evses"                          DROP CONSTRAINT IF EXISTS "stationPkId_evseTypeId"`,
      );
      await q(
        `ALTER TABLE "Connectors"                     DROP CONSTRAINT IF EXISTS "stationPkId_connectorId"`,
      );
      await q(
        `ALTER TABLE "Transactions"                   DROP CONSTRAINT IF EXISTS "stationPkId_transactionId"`,
      );
      await q(
        `ALTER TABLE "ChargingStationSequences"       DROP CONSTRAINT IF EXISTS "stationPkId_type"`,
      );
      await q(
        `ALTER TABLE "ChargingStationNetworkProfiles" DROP CONSTRAINT IF EXISTS "stationPkId_configurationSlot"`,
      );
      await q(
        `ALTER TABLE "ChargingStationNetworkProfiles" DROP CONSTRAINT IF EXISTS "CSNP_stationPkId_websocketServerConfigId_key"`,
      );
      // Also drop the truncated 63-char variant in case a previous partial run stored it.
      await q(
        `ALTER TABLE "ChargingStationNetworkProfiles" DROP CONSTRAINT IF EXISTS "ChargingStationNetworkProfile_stationPkId_websocketServerConf_k"`,
      );
      await q(
        `ALTER TABLE "VariableAttributes"             DROP CONSTRAINT IF EXISTS "stationPkId_type_variableId_componentId"`,
      );
      await q(`DROP INDEX IF EXISTS "variable_attributes_stationPkId"`);

      // Now drop FK constraints and remove the stationPkId column from each child table.
      for (const [table, fkName] of childTables) {
        await dropFkIfExists(table, fkName);
        const desc = await describeTable(table);
        if (desc['stationPkId']) {
          await queryInterface.removeColumn(table, 'stationPkId', { transaction } as any);
        }
      }

      // Restore ChargingStations primary key to id
      await q(
        `ALTER TABLE "ChargingStations" DROP CONSTRAINT IF EXISTS "ChargingStations_id_tenantId_key"`,
      );
      await q(`ALTER TABLE "ChargingStations" DROP CONSTRAINT IF EXISTS "ChargingStations_pkey"`);
      await q(`ALTER TABLE "ChargingStations" ADD PRIMARY KEY (id)`);

      const csDesc = await describeTable('ChargingStations');
      if (csDesc['pkId']) {
        await queryInterface.removeColumn('ChargingStations', 'pkId', { transaction } as any);
      }
      await q(`DROP SEQUENCE IF EXISTS "ChargingStations_pkId_seq"`);

      // Restore narrow unique constraints
      const restoreNarrowUnique = async (
        table: string,
        wideName: string,
        narrowName: string,
        columns: string[],
      ) => {
        await q(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${wideName}"`);
        const cols = columns.map((c) => `"${c}"`).join(', ');
        await q(`ALTER TABLE "${table}" ADD CONSTRAINT "${narrowName}" UNIQUE (${cols})`);
      };

      await restoreNarrowUnique(
        'ChargingStationSecurityInfos',
        'ChargingStationSecurityInfos_stationId_tenantId',
        'ChargingStationSecurityInfos_stationId_key',
        ['stationId'],
      );
      await restoreNarrowUnique(
        'Reservations',
        'Reservations_stationId_tenantId_id',
        'Reservations_stationId_id',
        ['stationId', 'id'],
      );
      await restoreNarrowUnique(
        'VariableMonitorings',
        'VariableMonitorings_stationId_tenantId_id',
        'VariableMonitorings_stationId_id',
        ['stationId', 'id'],
      );
      await restoreNarrowUnique(
        'MessageInfos',
        'MessageInfos_stationId_tenantId_id',
        'MessageInfos_stationId_id',
        ['stationId', 'id'],
      );
      await restoreNarrowUnique(
        'ChangeConfigurations',
        'ChangeConfigurations_stationId_tenantId_key',
        'ChangeConfigurations_stationId_key',
        ['stationId', 'key'],
      );
      await restoreNarrowUnique(
        'ChargingProfiles',
        'ChargingProfiles_stationId_tenantId_id',
        'ChargingProfiles_stationId_id',
        ['stationId', 'id'],
      );
      await restoreNarrowUnique(
        'ChargingSchedules',
        'ChargingSchedules_stationId_tenantId_id',
        'ChargingSchedules_stationId_id',
        ['stationId', 'id'],
      );
      await restoreNarrowUnique(
        'LocalListVersions',
        'LocalListVersions_stationId_tenantId',
        'LocalListVersions_stationId_key',
        ['stationId'],
      );
      await restoreNarrowUnique(
        'EventData',
        'EventData_stationId_tenantId_eventId',
        'EventData_stationId_eventId',
        ['stationId', 'eventId'],
      );
    }); // ── end transaction ──────────────────────────────────────────────────────
  },
};
