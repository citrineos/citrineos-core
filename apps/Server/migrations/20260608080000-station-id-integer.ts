// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE "ChargingStationSecurityInfos" ADD COLUMN IF NOT EXISTS "temp_fk" INTEGER;
      ALTER TABLE "EventData"                    ADD COLUMN IF NOT EXISTS "temp_fk" INTEGER;
      ALTER TABLE "InstalledCertificates"        ADD COLUMN IF NOT EXISTS "temp_fk" INTEGER;
      ALTER TABLE "OCPPMessages"                 ADD COLUMN IF NOT EXISTS "temp_fk" INTEGER;
      ALTER TABLE "SetNetworkProfiles"           ADD COLUMN IF NOT EXISTS "temp_fk" INTEGER;
      ALTER TABLE "VariableMonitorings"          ADD COLUMN IF NOT EXISTS "temp_fk" INTEGER;

      UPDATE "ChargingStationSecurityInfos" t SET "temp_fk" = cs."temp_id" FROM "ChargingStations" cs WHERE t."stationId" = cs."id";
      UPDATE "EventData"                    t SET "temp_fk" = cs."temp_id" FROM "ChargingStations" cs WHERE t."stationId" = cs."id";
      UPDATE "InstalledCertificates"        t SET "temp_fk" = cs."temp_id" FROM "ChargingStations" cs WHERE t."stationId" = cs."id";
      UPDATE "OCPPMessages"                 t SET "temp_fk" = cs."temp_id" FROM "ChargingStations" cs WHERE t."stationId" = cs."id";
      UPDATE "SetNetworkProfiles"           t SET "temp_fk" = cs."temp_id" FROM "ChargingStations" cs WHERE t."stationId" = cs."id";
      UPDATE "VariableMonitorings"          t SET "temp_fk" = cs."temp_id" FROM "ChargingStations" cs WHERE t."stationId" = cs."id";

      ALTER TABLE "ChargingStationNetworkProfiles" DROP CONSTRAINT IF EXISTS "ChargingStationNetworkProfiles_stationId_fkey";
      ALTER TABLE "ChargingStationSecurityInfos" DROP CONSTRAINT IF EXISTS "ChargingStationSecurityInfos_stationId_fkey";
      ALTER TABLE "ChargingStationSequences"     DROP CONSTRAINT IF EXISTS "ChargingStationSequences_stationId_fkey";
      ALTER TABLE "Connectors"                   DROP CONSTRAINT IF EXISTS "Connectors_stationId_fkey";
      ALTER TABLE "DeleteCertificateAttempts"    DROP CONSTRAINT IF EXISTS "DeleteCertificateAttempts_stationId_fkey";
      ALTER TABLE "EventData"                    DROP CONSTRAINT IF EXISTS "EventData_stationId_fkey";
      ALTER TABLE "Evses"                        DROP CONSTRAINT IF EXISTS "Evses_stationId_fkey";
      ALTER TABLE "InstallCertificateAttempts"   DROP CONSTRAINT IF EXISTS "InstallCertificateAttempts_stationId_fkey";
      ALTER TABLE "InstalledCertificates"        DROP CONSTRAINT IF EXISTS "InstalledCertificates_stationId_fkey";
      ALTER TABLE "LatestStatusNotifications"    DROP CONSTRAINT IF EXISTS "LatestStatusNotifications_stationId_fkey";
      ALTER TABLE "OCPPMessages"                 DROP CONSTRAINT IF EXISTS "OCPPMessages_stationId_fkey";
      ALTER TABLE "SetNetworkProfiles"           DROP CONSTRAINT IF EXISTS "SetNetworkProfiles_stationId_fkey";
      ALTER TABLE "StatusNotifications"          DROP CONSTRAINT IF EXISTS "StatusNotifications_stationId_fkey";
      ALTER TABLE "Transactions"                 DROP CONSTRAINT IF EXISTS "Transactions_stationId_fkey";
      ALTER TABLE "VariableAttributes"           DROP CONSTRAINT IF EXISTS "VariableAttributes_stationId_fkey";
      ALTER TABLE "VariableMonitorings"          DROP CONSTRAINT IF EXISTS "VariableMonitorings_stationId_fkey";

      ALTER TABLE "ChargingStationNetworkProfiles" ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "ChargingStationSecurityInfos"   ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "ChargingStationSequences"       ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "Connectors"                     ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "DeleteCertificateAttempts"      ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "EventData"                      ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "Evses"                          ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "InstallCertificateAttempts"     ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "InstalledCertificates"          ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "LatestStatusNotifications"      ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "OCPPMessages"                   ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "SetNetworkProfiles"             ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "StatusNotifications"            ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "Transactions"                   ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "VariableAttributes"             ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";
      ALTER TABLE "VariableMonitorings"            ALTER COLUMN "stationId" TYPE INTEGER USING "temp_fk";

      ALTER TABLE "ChargingStations" DROP CONSTRAINT "ChargingStations_pkey";
      ALTER TABLE "ChargingStations" ALTER COLUMN "id" TYPE INTEGER USING "temp_id";
      ALTER TABLE "ChargingStations" ADD CONSTRAINT "ChargingStations_pkey" PRIMARY KEY ("id");
      ALTER TABLE "ChargingStations" ALTER COLUMN "id" SET DEFAULT nextval('"ChargingStations_id_seq"');
      ALTER SEQUENCE "ChargingStations_id_seq" OWNED BY "ChargingStations"."id";

      ALTER TABLE "ChargingStationNetworkProfiles" ADD CONSTRAINT "ChargingStationNetworkProfiles_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "ChargingStationSecurityInfos" ADD CONSTRAINT "ChargingStationSecurityInfos_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "ChargingStationSequences"     ADD CONSTRAINT "ChargingStationSequences_stationId_fkey"     FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "Connectors"                   ADD CONSTRAINT "Connectors_stationId_fkey"                   FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "DeleteCertificateAttempts"    ADD CONSTRAINT "DeleteCertificateAttempts_stationId_fkey"    FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE;
      ALTER TABLE "EventData"                    ADD CONSTRAINT "EventData_stationId_fkey"                    FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "Evses"                        ADD CONSTRAINT "Evses_stationId_fkey"                        FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "InstallCertificateAttempts"   ADD CONSTRAINT "InstallCertificateAttempts_stationId_fkey"   FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE;
      ALTER TABLE "InstalledCertificates"        ADD CONSTRAINT "InstalledCertificates_stationId_fkey"        FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE;
      ALTER TABLE "LatestStatusNotifications"    ADD CONSTRAINT "LatestStatusNotifications_stationId_fkey"    FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE;
      ALTER TABLE "OCPPMessages"                 ADD CONSTRAINT "OCPPMessages_stationId_fkey"                 FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "SetNetworkProfiles"           ADD CONSTRAINT "SetNetworkProfiles_stationId_fkey"           FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE;
      ALTER TABLE "StatusNotifications"          ADD CONSTRAINT "StatusNotifications_stationId_fkey"          FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "Transactions"                 ADD CONSTRAINT "Transactions_stationId_fkey"                 FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "VariableAttributes"           ADD CONSTRAINT "VariableAttributes_stationId_fkey"           FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "VariableMonitorings"          ADD CONSTRAINT "VariableMonitorings_stationId_fkey"          FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;

      CREATE OR REPLACE FUNCTION fn_charging_stations_temp_insert()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        NEW."temp_id" := NEW."id";
        RETURN NEW;
      END; $$;

      CREATE OR REPLACE FUNCTION fn_temp_fk_insert()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        NEW."temp_fk" := NEW."stationId";
        RETURN NEW;
      END; $$;

      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "ChargingStationSecurityInfos";
      CREATE TRIGGER trg_temp_fk_insert BEFORE INSERT ON "ChargingStationSecurityInfos" FOR EACH ROW EXECUTE FUNCTION fn_temp_fk_insert();
      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "EventData";
      CREATE TRIGGER trg_temp_fk_insert BEFORE INSERT ON "EventData"                    FOR EACH ROW EXECUTE FUNCTION fn_temp_fk_insert();
      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "InstalledCertificates";
      CREATE TRIGGER trg_temp_fk_insert BEFORE INSERT ON "InstalledCertificates"        FOR EACH ROW EXECUTE FUNCTION fn_temp_fk_insert();
      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "OCPPMessages";
      CREATE TRIGGER trg_temp_fk_insert BEFORE INSERT ON "OCPPMessages"                 FOR EACH ROW EXECUTE FUNCTION fn_temp_fk_insert();
      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "SetNetworkProfiles";
      CREATE TRIGGER trg_temp_fk_insert BEFORE INSERT ON "SetNetworkProfiles"           FOR EACH ROW EXECUTE FUNCTION fn_temp_fk_insert();
      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "VariableMonitorings";
      CREATE TRIGGER trg_temp_fk_insert BEFORE INSERT ON "VariableMonitorings"          FOR EACH ROW EXECUTE FUNCTION fn_temp_fk_insert();

      COMMIT;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      BEGIN;

      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "ChargingStationSecurityInfos";
      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "EventData";
      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "InstalledCertificates";
      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "OCPPMessages";
      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "SetNetworkProfiles";
      DROP TRIGGER IF EXISTS trg_temp_fk_insert ON "VariableMonitorings";

      CREATE OR REPLACE FUNCTION fn_charging_stations_temp_insert()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        NEW."temp_id" := nextval('"ChargingStations_id_seq"');
        NEW."ocppConnectionName" := NEW."id";
        RETURN NEW;
      END; $$;

      CREATE OR REPLACE FUNCTION fn_temp_fk_insert()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        SELECT "temp_id" INTO NEW."temp_fk"
        FROM "ChargingStations" WHERE "id" = NEW."stationId";
        RETURN NEW;
      END; $$;

      ALTER TABLE "ChargingStationNetworkProfiles" DROP CONSTRAINT IF EXISTS "ChargingStationNetworkProfiles_stationId_fkey";
      ALTER TABLE "ChargingStationSecurityInfos" DROP CONSTRAINT IF EXISTS "ChargingStationSecurityInfos_stationId_fkey";
      ALTER TABLE "ChargingStationSequences"     DROP CONSTRAINT IF EXISTS "ChargingStationSequences_stationId_fkey";
      ALTER TABLE "Connectors"                   DROP CONSTRAINT IF EXISTS "Connectors_stationId_fkey";
      ALTER TABLE "DeleteCertificateAttempts"    DROP CONSTRAINT IF EXISTS "DeleteCertificateAttempts_stationId_fkey";
      ALTER TABLE "EventData"                    DROP CONSTRAINT IF EXISTS "EventData_stationId_fkey";
      ALTER TABLE "Evses"                        DROP CONSTRAINT IF EXISTS "Evses_stationId_fkey";
      ALTER TABLE "InstallCertificateAttempts"   DROP CONSTRAINT IF EXISTS "InstallCertificateAttempts_stationId_fkey";
      ALTER TABLE "InstalledCertificates"        DROP CONSTRAINT IF EXISTS "InstalledCertificates_stationId_fkey";
      ALTER TABLE "LatestStatusNotifications"    DROP CONSTRAINT IF EXISTS "LatestStatusNotifications_stationId_fkey";
      ALTER TABLE "OCPPMessages"                 DROP CONSTRAINT IF EXISTS "OCPPMessages_stationId_fkey";
      ALTER TABLE "SetNetworkProfiles"           DROP CONSTRAINT IF EXISTS "SetNetworkProfiles_stationId_fkey";
      ALTER TABLE "StatusNotifications"          DROP CONSTRAINT IF EXISTS "StatusNotifications_stationId_fkey";
      ALTER TABLE "Transactions"                 DROP CONSTRAINT IF EXISTS "Transactions_stationId_fkey";
      ALTER TABLE "VariableAttributes"           DROP CONSTRAINT IF EXISTS "VariableAttributes_stationId_fkey";
      ALTER TABLE "VariableMonitorings"          DROP CONSTRAINT IF EXISTS "VariableMonitorings_stationId_fkey";

      ALTER TABLE "ChargingStations" DROP CONSTRAINT "ChargingStations_pkey";
      ALTER TABLE "ChargingStations" ALTER COLUMN "id" DROP DEFAULT;
      ALTER TABLE "ChargingStations" ALTER COLUMN "id" TYPE VARCHAR(36) USING "ocppConnectionName";
      ALTER TABLE "ChargingStations" ADD CONSTRAINT "ChargingStations_pkey" PRIMARY KEY ("id");
      ALTER SEQUENCE "ChargingStations_id_seq" OWNED BY "ChargingStations"."temp_id";

      UPDATE "ChargingStationNetworkProfiles" t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "ChargingStationSecurityInfos"   t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "ChargingStationSequences"       t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "Connectors"                     t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "DeleteCertificateAttempts"      t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "EventData"                      t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "Evses"                          t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "InstallCertificateAttempts"     t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "InstalledCertificates"          t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "LatestStatusNotifications"      t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "OCPPMessages"                   t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "SetNetworkProfiles"             t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "StatusNotifications"            t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "Transactions"                   t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "VariableAttributes"             t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;
      UPDATE "VariableMonitorings"            t SET "stationId" = cs."ocppConnectionName" FROM "ChargingStations" cs WHERE t."stationId"::text = cs."id"::text;

      ALTER TABLE "ChargingStationNetworkProfiles" ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "ChargingStationSecurityInfos"   ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "ChargingStationSequences"       ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "Connectors"                     ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "DeleteCertificateAttempts"      ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "EventData"                      ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "Evses"                          ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "InstallCertificateAttempts"     ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "InstalledCertificates"          ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "LatestStatusNotifications"      ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "OCPPMessages"                   ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "SetNetworkProfiles"             ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "StatusNotifications"            ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "Transactions"                   ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "VariableAttributes"             ALTER COLUMN "stationId" TYPE VARCHAR(255);
      ALTER TABLE "VariableMonitorings"            ALTER COLUMN "stationId" TYPE VARCHAR(255);

      ALTER TABLE "ChargingStationNetworkProfiles" ADD CONSTRAINT "ChargingStationNetworkProfiles_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "ChargingStationSecurityInfos" ADD CONSTRAINT "ChargingStationSecurityInfos_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "ChargingStationSequences"     ADD CONSTRAINT "ChargingStationSequences_stationId_fkey"     FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "Connectors"                   ADD CONSTRAINT "Connectors_stationId_fkey"                   FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "DeleteCertificateAttempts"    ADD CONSTRAINT "DeleteCertificateAttempts_stationId_fkey"    FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE;
      ALTER TABLE "EventData"                    ADD CONSTRAINT "EventData_stationId_fkey"                    FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "Evses"                        ADD CONSTRAINT "Evses_stationId_fkey"                        FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "InstallCertificateAttempts"   ADD CONSTRAINT "InstallCertificateAttempts_stationId_fkey"   FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE;
      ALTER TABLE "InstalledCertificates"        ADD CONSTRAINT "InstalledCertificates_stationId_fkey"        FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE;
      ALTER TABLE "LatestStatusNotifications"    ADD CONSTRAINT "LatestStatusNotifications_stationId_fkey"    FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE;
      ALTER TABLE "OCPPMessages"                 ADD CONSTRAINT "OCPPMessages_stationId_fkey"                 FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "SetNetworkProfiles"           ADD CONSTRAINT "SetNetworkProfiles_stationId_fkey"           FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE;
      ALTER TABLE "StatusNotifications"          ADD CONSTRAINT "StatusNotifications_stationId_fkey"          FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "Transactions"                 ADD CONSTRAINT "Transactions_stationId_fkey"                 FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "VariableAttributes"           ADD CONSTRAINT "VariableAttributes_stationId_fkey"           FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;
      ALTER TABLE "VariableMonitorings"          ADD CONSTRAINT "VariableMonitorings_stationId_fkey"          FOREIGN KEY ("stationId") REFERENCES "ChargingStations"(id) ON UPDATE CASCADE ON DELETE CASCADE;

      ALTER TABLE "ChargingStationSecurityInfos" DROP COLUMN IF EXISTS "temp_fk";
      ALTER TABLE "EventData"                    DROP COLUMN IF EXISTS "temp_fk";
      ALTER TABLE "InstalledCertificates"        DROP COLUMN IF EXISTS "temp_fk";
      ALTER TABLE "OCPPMessages"                 DROP COLUMN IF EXISTS "temp_fk";
      ALTER TABLE "SetNetworkProfiles"           DROP COLUMN IF EXISTS "temp_fk";
      ALTER TABLE "VariableMonitorings"          DROP COLUMN IF EXISTS "temp_fk";

      COMMIT;
    `);
  },
};
