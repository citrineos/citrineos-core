// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { QueryInterface } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
    // 1. Drop any existing temp tables first, then create temp tables to preserve data from related tables
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "IdTokens_temp"');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "IdTokenInfos_temp"');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "AdditionalInfos_temp"');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Authorizations_temp"');

    await queryInterface.sequelize.query(`
      CREATE TABLE "IdTokens_temp" AS TABLE "IdTokens";
    `);
    await queryInterface.sequelize.query(`
      CREATE TABLE "IdTokenInfos_temp" AS TABLE "IdTokenInfos";
    `);
    await queryInterface.sequelize.query(`
      CREATE TABLE "AdditionalInfos_temp" AS TABLE "AdditionalInfos";
    `);
    await queryInterface.sequelize.query(`
      CREATE TABLE "Authorizations_temp" AS TABLE "Authorizations";
    `);

    // 2. Alter the Authorizations table: add new flat columns, but do not drop old columns yet
    // Check if columns exist before adding them
    const tableDescription = await queryInterface.describeTable('Authorizations');

    if (!tableDescription['idToken']) {
      await queryInterface.addColumn('Authorizations', 'idToken', {
        type: 'VARCHAR(255)',
        allowNull: true,
      });
    }
    if (!tableDescription['idTokenType']) {
      await queryInterface.addColumn('Authorizations', 'idTokenType', {
        type: 'VARCHAR(255)',
        allowNull: true,
      });
    }
    if (!tableDescription['additionalInfo']) {
      await queryInterface.addColumn('Authorizations', 'additionalInfo', {
        type: 'JSONB',
        allowNull: true,
      });
    }
    if (!tableDescription['status']) {
      await queryInterface.addColumn('Authorizations', 'status', {
        type: 'VARCHAR(255)',
        allowNull: true,
      });
    }
    if (!tableDescription['cacheExpiryDateTime']) {
      await queryInterface.addColumn('Authorizations', 'cacheExpiryDateTime', {
        type: 'TIMESTAMP WITH TIME ZONE',
        allowNull: true,
      });
    }
    if (!tableDescription['chargingPriority']) {
      await queryInterface.addColumn('Authorizations', 'chargingPriority', {
        type: 'INTEGER',
        allowNull: true,
      });
    }
    if (!tableDescription['language1']) {
      await queryInterface.addColumn('Authorizations', 'language1', {
        type: 'VARCHAR(255)',
        allowNull: true,
      });
    }
    if (!tableDescription['language2']) {
      await queryInterface.addColumn('Authorizations', 'language2', {
        type: 'VARCHAR(255)',
        allowNull: true,
      });
    }
    if (!tableDescription['personalMessage']) {
      await queryInterface.addColumn('Authorizations', 'personalMessage', {
        type: 'JSON',
        allowNull: true,
      });
    }
    if (!tableDescription['groupIdTokenId']) {
      await queryInterface.addColumn('Authorizations', 'groupIdTokenId', {
        type: 'INTEGER',
        allowNull: true,
        references: { model: 'Authorizations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
    // concurrentTransaction already exists from previous migration, skip it
    if (!tableDescription['customData']) {
      await queryInterface.addColumn('Authorizations', 'customData', {
        type: 'JSONB',
        allowNull: true,
      });
    }
    if (!tableDescription['groupAuthorizationId']) {
      await queryInterface.addColumn('Authorizations', 'groupAuthorizationId', {
        type: 'INTEGER',
        allowNull: true,
      });
    }
    // Ensure personalMessage is JSONB
    if (
      tableDescription['personalMessage'] &&
      tableDescription['personalMessage'].type !== 'JSONB'
    ) {
      await queryInterface.changeColumn('Authorizations', 'personalMessage', {
        type: 'JSONB',
        allowNull: true,
      });
    }
    // Ensure concurrentTransaction is BOOLEAN
    if (
      tableDescription['concurrentTransaction'] &&
      tableDescription['concurrentTransaction'].type !== 'BOOLEAN'
    ) {
      await queryInterface.changeColumn('Authorizations', 'concurrentTransaction', {
        type: 'BOOLEAN',
        allowNull: true,
      });
    }

    // 3. Copy/transform data from old columns/related tables into new flat columns
    await queryInterface.sequelize.query(`
      UPDATE "Authorizations"
      SET
        "idToken" = subq."idToken",
        "idTokenType" = subq."idTokenType",
        "additionalInfo" = subq."additionalInfo",
        "status" = subq."status",
        "cacheExpiryDateTime" = subq."cacheExpiryDateTime",
        "chargingPriority" = subq."chargingPriority",
        "language1" = subq."language1",
        "language2" = subq."language2",
        "personalMessage" = subq."personalMessage",
        "groupIdTokenId" = subq."groupIdTokenId",
        "concurrentTransaction" = subq."concurrentTransaction",
        "customData" = NULL
      FROM (
        SELECT 
          auth."id" as auth_id,
          t."idToken",
          t."type" as "idTokenType",
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'additionalIdToken', ai."additionalIdToken",
                  'type', ai."type"
                )
              )
              FROM "AdditionalInfos" ai
              INNER JOIN "IdTokenAdditionalInfos" itai ON ai."id" = itai."additionalInfoId"
              WHERE itai."idTokenId" = t."id"
            ),
            NULL
          ) as "additionalInfo",
          COALESCE(info."status", 'Accepted') as "status",
          info."cacheExpiryDateTime",
          info."chargingPriority",
          info."language1",
          info."language2",
          info."personalMessage",
          CASE 
            WHEN info."groupIdTokenId" IS NOT NULL THEN (
              SELECT auth2."id"
              FROM "Authorizations" auth2
              WHERE auth2."idTokenId" = info."groupIdTokenId"
              LIMIT 1
            )
            ELSE NULL
          END as "groupIdTokenId",
          COALESCE(auth."concurrentTransaction", false) as "concurrentTransaction"
        FROM "Authorizations" auth
        INNER JOIN "IdTokens" t ON auth."idTokenId" = t."id"
        LEFT JOIN "IdTokenInfos" info ON auth."idTokenInfoId" = info."id"
      ) subq
      WHERE "Authorizations"."id" = subq.auth_id
    `);

    // 4. Set NOT NULL and default constraints on new columns as needed
    await queryInterface.changeColumn('Authorizations', 'idToken', {
      type: 'VARCHAR(255)',
      allowNull: false,
    });
    await queryInterface.changeColumn('Authorizations', 'status', {
      type: 'VARCHAR(255)',
      allowNull: false,
      defaultValue: 'Accepted',
    });

    // 5. Drop old columns and tables
    await queryInterface
      .removeConstraint('Authorizations', 'Authorizations_idTokenId_fkey')
      .catch(() => {});
    await queryInterface
      .removeConstraint('Authorizations', 'Authorizations_idTokenInfoId_fkey')
      .catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'idTokenId').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'idTokenInfoId').catch(() => {});

    // Drop all foreign key constraints systematically
    const constraintsToRemove = [
      // IdTokens table constraints
      ['IdTokenInfos', 'IdTokenInfos_groupIdTokenId_fkey'],
      ['IdTokenAdditionalInfos', 'IdTokenAdditionalInfos_idTokenId_fkey'],
      ['TransactionEvents', 'TransactionEvents_idTokenId_fkey'],
      ['StopTransactions', 'StopTransactions_idTokenDatabaseId_fkey'],
      ['StartTransactions', 'StartTransactions_idTokenDatabaseId_fkey'],
      ['LocalListAuthorizations', 'LocalListAuthorizations_idTokenId_fkey'],
      // IdTokenInfos table constraints
      ['LocalListAuthorizations', 'LocalListAuthorizations_idTokenInfoId_fkey'],
      // AdditionalInfos table constraints
      ['IdTokenAdditionalInfos', 'IdTokenAdditionalInfos_additionalInfoId_fkey'],
    ];

    for (const [tableName, constraintName] of constraintsToRemove) {
      await queryInterface.removeConstraint(tableName, constraintName).catch(() => {});
    }

    // Drop junction table first
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "IdTokenAdditionalInfos"');

    // Drop temp tables and old tables in correct order
    const tablesToDrop = [
      'Authorizations_temp',
      'IdTokens_temp',
      'IdTokenInfos_temp',
      'AdditionalInfos_temp',
      'IdTokenInfos',
      'AdditionalInfos',
      'IdTokens',
    ];

    for (const tableName of tablesToDrop) {
      await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${tableName}"`);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // 1. Add back the old columns to Authorizations table
    await queryInterface.addColumn('Authorizations', 'idTokenId', {
      type: 'INTEGER',
      allowNull: true,
    });
    await queryInterface.addColumn('Authorizations', 'idTokenInfoId', {
      type: 'INTEGER',
      allowNull: true,
    });

    // 2. Recreate old tables structure
    await queryInterface.sequelize.query(`
      CREATE TABLE "IdTokens" (
        "id" SERIAL PRIMARY KEY,
        "idToken" VARCHAR(255) NOT NULL,
        "type" VARCHAR(255),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    await queryInterface.sequelize.query(`
      CREATE TABLE "IdTokenInfos" (
        "id" SERIAL PRIMARY KEY,
        "info" JSONB,
        "status" VARCHAR(255),
        "cacheExpiryDateTime" TIMESTAMP WITH TIME ZONE,
        "chargingPriority" INTEGER,
        "language1" VARCHAR(255),
        "language2" VARCHAR(255),
        "personalMessage" JSON,
        "groupIdTokenId" INTEGER,
        "concurrentTransaction" BOOLEAN,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
    await queryInterface.sequelize.query(`
      CREATE TABLE "AdditionalInfos" (
        "id" SERIAL PRIMARY KEY,
        "additionalIdToken" VARCHAR(255) NOT NULL,
        "type" VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE("additionalIdToken", "type")
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE "IdTokenAdditionalInfos" (
        "id" SERIAL PRIMARY KEY,
        "idTokenId" INTEGER REFERENCES "IdTokens"("id") ON DELETE CASCADE,
        "additionalInfoId" INTEGER REFERENCES "AdditionalInfos"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE("idTokenId", "additionalInfoId")
      );
    `);

    // 3. Restore data to the recreated tables from flattened Authorization data
    // Insert IdTokens from flattened data
    await queryInterface.sequelize.query(`
      INSERT INTO "IdTokens" ("idToken", "type", "createdAt", "updatedAt")
      SELECT DISTINCT "idToken", "idTokenType", "createdAt", "updatedAt"
      FROM "Authorizations"
      WHERE "idToken" IS NOT NULL
      ON CONFLICT ("idToken", "type") DO NOTHING
    `);

    // Insert IdTokenInfos from flattened data (with proper groupIdTokenId handling)
    await queryInterface.sequelize.query(`
      INSERT INTO "IdTokenInfos" (
        "status", "cacheExpiryDateTime", "chargingPriority", "language1", "language2",
        "personalMessage", "groupIdTokenId", "concurrentTransaction", "createdAt", "updatedAt"
      )
      SELECT DISTINCT
        "status", "cacheExpiryDateTime", "chargingPriority", "language1", "language2",
        "personalMessage", 
        CASE 
          WHEN "groupIdTokenId" IS NOT NULL THEN (
            SELECT t."id"
            FROM "IdTokens" t
            INNER JOIN "Authorizations" auth ON auth."idToken" = t."idToken" AND auth."idTokenType" = t."type"
            WHERE auth."id" = "Authorizations"."groupIdTokenId"
            LIMIT 1
          )
          ELSE NULL
        END as "groupIdTokenId",
        "concurrentTransaction", "createdAt", "updatedAt"
      FROM "Authorizations"
      WHERE "status" IS NOT NULL
    `);

    // Insert AdditionalInfos from flattened additionalInfo JSONB array
    await queryInterface.sequelize.query(`
      INSERT INTO "AdditionalInfos" ("additionalIdToken", "type", "createdAt", "updatedAt")
      SELECT DISTINCT
        (jsonb_array_elements("additionalInfo")->>'additionalIdToken')::VARCHAR(255),
        (jsonb_array_elements("additionalInfo")->>'type')::VARCHAR(255),
        "createdAt",
        "updatedAt"
      FROM "Authorizations"
      WHERE "additionalInfo" IS NOT NULL 
        AND jsonb_array_length("additionalInfo") > 0
      ON CONFLICT ("additionalIdToken", "type") DO NOTHING
    `);

    // Create IdTokenAdditionalInfo junction table relationships
    await queryInterface.sequelize.query(`
      INSERT INTO "IdTokenAdditionalInfos" ("idTokenId", "additionalInfoId", "createdAt", "updatedAt")
      SELECT DISTINCT
        t."id" as "idTokenId",
        ai."id" as "additionalInfoId",
        a."createdAt",
        a."updatedAt"
      FROM "Authorizations" a
      INNER JOIN "IdTokens" t ON a."idToken" = t."idToken" AND a."idTokenType" = t."type"
      CROSS JOIN LATERAL jsonb_array_elements(a."additionalInfo") as elem
      INNER JOIN "AdditionalInfos" ai ON 
        ai."additionalIdToken" = (elem->>'additionalIdToken')::VARCHAR(255) AND
        ai."type" = (elem->>'type')::VARCHAR(255)
      WHERE a."additionalInfo" IS NOT NULL 
        AND jsonb_array_length(a."additionalInfo") > 0
      ON CONFLICT ("idTokenId", "additionalInfoId") DO NOTHING
    `);

    // 4. Update Authorizations with foreign key references
    await queryInterface.sequelize.query(`
      UPDATE "Authorizations"
      SET 
        "idTokenId" = t."id",
        "idTokenInfoId" = (
          SELECT info."id"
          FROM "IdTokenInfos" info
          WHERE COALESCE("Authorizations"."status", 'Accepted') = info."status"
            AND COALESCE("Authorizations"."cacheExpiryDateTime", '1970-01-01'::timestamp) = COALESCE(info."cacheExpiryDateTime", '1970-01-01'::timestamp)
            AND COALESCE("Authorizations"."chargingPriority", -999) = COALESCE(info."chargingPriority", -999)
            AND COALESCE("Authorizations"."language1", '') = COALESCE(info."language1", '')
            AND COALESCE("Authorizations"."language2", '') = COALESCE(info."language2", '')
          LIMIT 1
        )
      FROM "IdTokens" t
      WHERE "Authorizations"."idToken" = t."idToken"
        AND COALESCE("Authorizations"."idTokenType", '') = COALESCE(t."type", '')
    `);

    // 5. Add foreign key constraints back
    await queryInterface.addConstraint('Authorizations', {
      fields: ['idTokenId'],
      type: 'foreign key',
      name: 'Authorizations_idTokenId_fkey',
      references: { table: 'IdTokens', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('Authorizations', {
      fields: ['idTokenInfoId'],
      type: 'foreign key',
      name: 'Authorizations_idTokenInfoId_fkey',
      references: { table: 'IdTokenInfos', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // 6. Remove flattened columns
    await queryInterface.removeColumn('Authorizations', 'idToken').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'idTokenType').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'additionalInfo').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'status').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'cacheExpiryDateTime').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'chargingPriority').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'language1').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'language2').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'personalMessage').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'groupIdTokenId').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'concurrentTransaction').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'customData').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'groupAuthorizationId').catch(() => {});
  },
};
