import { QueryInterface } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
    // 1. Create a temp table with the old Authorization structure
    await queryInterface.sequelize.query(`
      CREATE TABLE "Authorizations_temp" AS TABLE "Authorizations";
    `);

    // 2. Alter the Authorizations table: add new flat columns, but do not drop old columns yet
    await queryInterface.addColumn('Authorizations', 'idToken', {
      type: 'VARCHAR(255)',
      allowNull: true, // temporarily allow null for migration
    });
    await queryInterface.addColumn('Authorizations', 'idTokenType', {
      type: 'VARCHAR(255)',
      allowNull: true,
    });
    await queryInterface.addColumn('Authorizations', 'additionalInfo', {
      type: 'JSONB',
      allowNull: true,
    });
    await queryInterface.addColumn('Authorizations', 'status', {
      type: 'VARCHAR(255)',
      allowNull: true,
    });
    await queryInterface.addColumn('Authorizations', 'cacheExpiryDateTime', {
      type: 'TIMESTAMP WITH TIME ZONE',
      allowNull: true,
    });
    await queryInterface.addColumn('Authorizations', 'chargingPriority', {
      type: 'INTEGER',
      allowNull: true,
    });
    await queryInterface.addColumn('Authorizations', 'language1', {
      type: 'VARCHAR(255)',
      allowNull: true,
    });
    await queryInterface.addColumn('Authorizations', 'language2', {
      type: 'VARCHAR(255)',
      allowNull: true,
    });
    await queryInterface.addColumn('Authorizations', 'personalMessage', {
      type: 'JSON',
      allowNull: true,
    });
    await queryInterface.addColumn('Authorizations', 'groupIdTokenId', {
      type: 'INTEGER',
      allowNull: true,
      references: { model: 'Authorizations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('Authorizations', 'concurrentTransaction', {
      type: 'BOOLEAN',
      allowNull: true,
    });
    await queryInterface
      .addColumn('Authorizations', 'customData', {
        type: 'JSONB',
        allowNull: true,
      })
      .catch(() => {});

    // 3. Copy/transform data from old columns/related tables into new flat columns
    // This assumes you have logic to join IdToken/IdTokenInfo/AdditionalInfo as needed
    await queryInterface.sequelize.query(`
      UPDATE "Authorizations" a
      SET
        idToken = t."idToken",
        idTokenType = t."type",
        additionalInfo = i."info",
        status = info."status",
        cacheExpiryDateTime = info."cacheExpiryDateTime",
        chargingPriority = info."chargingPriority",
        language1 = info."language1",
        language2 = info."language2",
        personalMessage = info."personalMessage",
        groupIdTokenId = info."groupIdTokenId",
        concurrentTransaction = info."concurrentTransaction"
      FROM "IdTokens" t
      LEFT JOIN "IdTokenInfos" info ON a."idTokenInfoId" = info."id"
      LEFT JOIN "AdditionalInfos" i ON a."id" = i."authorizationId"
      WHERE a."idTokenId" = t."id"
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

    // 5. Drop old columns and temp table
    await queryInterface
      .removeConstraint('Authorizations', 'Authorizations_idTokenId_fkey')
      .catch(() => {});
    await queryInterface
      .removeConstraint('Authorizations', 'Authorizations_idTokenInfoId_fkey')
      .catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'idTokenId').catch(() => {});
    await queryInterface.removeColumn('Authorizations', 'idTokenInfoId').catch(() => {});
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Authorizations_temp"');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "IdTokens"');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "IdTokenInfos"');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "AdditionalInfos"');
  },

  down: async (queryInterface: QueryInterface) => {
    // 1. Recreate old tables structure
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
        "authorizationId" INTEGER REFERENCES "Authorizations"("id") ON DELETE CASCADE,
        "info" JSONB,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    // 2. Restore data from temp table
    await queryInterface.sequelize.query(`
      INSERT INTO "Authorizations" (
        "id",
        "idTokenId",
        "idTokenInfoId",
        "createdAt",
        "updatedAt"
      )
      SELECT
        "id",
        "idTokenId",
        "idTokenInfoId",
        "createdAt",
        "updatedAt"
      FROM "Authorizations_temp";
    `);

    // 3. Drop temp table
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "Authorizations_temp"');
  },
};
