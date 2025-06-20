'use strict';

import { QueryInterface } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Authorizations" DROP CONSTRAINT IF EXISTS "Authorizations_idTokenId_fkey";
      ALTER TABLE "Authorizations" DROP CONSTRAINT IF EXISTS "Authorizations_idTokenInfoId_fkey";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "idTokenId";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "idTokenInfoId";

      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "idToken" VARCHAR(255);
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "type" VARCHAR(255);
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "additionalInfo" JSONB;
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "status" VARCHAR(255);
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "cacheExpiryDateTime" TIMESTAMP WITH TIME ZONE;
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "chargingPriority" INTEGER;
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "language1" VARCHAR(255);
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "language2" VARCHAR(255);
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "personalMessage" JSON;
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "groupIdTokenId" INTEGER REFERENCES "Authorizations"(id) ON UPDATE CASCADE;
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "concurrentTransaction" BOOLEAN DEFAULT FALSE;
      ALTER TABLE "Authorizations" ADD COLUMN IF NOT EXISTS "customData" JSON;

      ALTER TABLE "LocalListAuthorizations" DROP CONSTRAINT IF EXISTS "LocalListAuthorizations_idTokenId_fkey";
      ALTER TABLE "LocalListAuthorizations" DROP CONSTRAINT IF EXISTS "LocalListAuthorizations_idTokenInfoId_fkey";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "idTokenId";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "idTokenInfoId";

      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "idToken" VARCHAR(255);
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "type" VARCHAR(255);
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "additionalInfo" JSONB;
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "status" VARCHAR(255);
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "cacheExpiryDateTime" TIMESTAMP WITH TIME ZONE;
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "chargingPriority" INTEGER;
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "language1" VARCHAR(255);
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "language2" VARCHAR(255);
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "personalMessage" JSON;
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "groupIdTokenId" INTEGER REFERENCES "LocalListAuthorizations"(id) ON UPDATE CASCADE;
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "concurrentTransaction" BOOLEAN DEFAULT FALSE;
      ALTER TABLE "LocalListAuthorizations" ADD COLUMN IF NOT EXISTS "customData" JSON;

      DROP TABLE IF EXISTS "IdTokens" CASCADE;
      DROP TABLE IF EXISTS "IdTokenInfos" CASCADE;
      DROP TABLE IF EXISTS "IdTokenAdditionalInfos" CASCADE;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "idToken";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "type";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "additionalInfo";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "status";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "cacheExpiryDateTime";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "chargingPriority";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "language1";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "language2";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "personalMessage";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "groupIdTokenId";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "concurrentTransaction";
      ALTER TABLE "Authorizations" DROP COLUMN IF EXISTS "customData";

      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "idToken";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "type";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "additionalInfo";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "status";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "cacheExpiryDateTime";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "chargingPriority";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "language1";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "language2";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "personalMessage";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "groupIdTokenId";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "concurrentTransaction";
      ALTER TABLE "LocalListAuthorizations" DROP COLUMN IF EXISTS "customData";
    `);
  },
};
