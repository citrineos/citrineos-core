// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION "TransactionNotify"()
      RETURNS trigger AS $$
      DECLARE
        requiredFields text[] := ARRAY['id', 'transactionId', 'tenantId', 'updatedAt'];
        requiredData jsonb;
        changedData jsonb;
        notificationData jsonb;
        tenantData jsonb;
      BEGIN
        -- Fetch tenant object
        SELECT to_jsonb(t) INTO tenantData FROM "Tenants" t WHERE t."id" = COALESCE(NEW."tenantId", OLD."tenantId");

        IF TG_OP = 'INSERT' THEN
          notificationData := to_jsonb(NEW) || jsonb_build_object('tenant', tenantData);
        ELSIF TG_OP = 'UPDATE' THEN
          SELECT jsonb_object_agg(n.key, n.value) INTO requiredData
          FROM jsonb_each(to_jsonb(NEW)) n
          WHERE n.key = ANY(requiredFields);

          SELECT jsonb_object_agg(n.key, n.value) INTO changedData
          FROM jsonb_each(to_jsonb(NEW)) n
          JOIN jsonb_each(to_jsonb(OLD)) o ON n.key = o.key
          WHERE n.value IS DISTINCT FROM o.value
          AND n.key != ALL(requiredFields);

          -- Only proceed if non-required fields changed
          IF changedData IS NULL OR changedData = '{}'::jsonb THEN
            RETURN COALESCE(NEW, OLD);
          END IF;

          notificationData := requiredData || COALESCE(changedData, '{}'::jsonb) || jsonb_build_object('tenant', tenantData);
        END IF;

        PERFORM pg_notify(
          'TransactionNotification',
          json_build_object(
            'operation', TG_OP,
            'data', notificationData
          )::text
        );

        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER "TransactionNotification"
      AFTER INSERT OR UPDATE ON "Transactions"
      FOR EACH ROW
      EXECUTE FUNCTION "TransactionNotify"();
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS "TransactionNotification" ON "Transactions";
    `);

    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS "TransactionNotify"();
    `);
  },
};
