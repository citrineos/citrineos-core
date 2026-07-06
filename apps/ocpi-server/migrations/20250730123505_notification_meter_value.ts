// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION "MeterValueNotify"()
      RETURNS trigger AS $$
      DECLARE
        notificationData jsonb;
        tenantData jsonb;
      BEGIN
        IF TG_OP = 'INSERT' AND NEW."transactionDatabaseId" IS NOT NULL THEN
          -- Get tenant data
          SELECT to_jsonb(t) INTO tenantData 
          FROM "Tenants" t 
          WHERE t."id" = NEW."tenantId";

          -- Merge all MeterValues fields, and tenant
          notificationData := to_jsonb(NEW)
            || jsonb_build_object('tenant', tenantData);

          -- Only notify when transactionDatabaseId is not null
          PERFORM pg_notify(
            'MeterValueNotification',
            json_build_object(
              'operation', TG_OP,
              'data', notificationData
            )::text
          );
        END IF;

        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER "MeterValueNotification"
      AFTER INSERT ON "MeterValues"
      FOR EACH ROW
      EXECUTE FUNCTION "MeterValueNotify"();
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS "MeterValueNotification" ON "MeterValues";
    `);

    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS "MeterValueNotify"();
    `);
  },
};
