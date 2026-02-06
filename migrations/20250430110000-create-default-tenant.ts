// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { QueryInterface, QueryTypes } from 'sequelize';

const TENANTS_TABLE = `Tenants`;

export default {
  up: async (queryInterface: QueryInterface) => {
    const migrationName = '20250430110000-create-default-tenant';

    const [results] = await queryInterface.sequelize.query(
      `SELECT EXISTS (
      SELECT 1 
      FROM "SequelizeMeta" 
      WHERE name LIKE :pattern
    ) AS migration_exists`,
      {
        replacements: { pattern: `${migrationName}%` },
        type: QueryTypes.SELECT,
      },
    );

    if ((results as any).migration_exists) {
      console.log('Migration already run, skipping...');
      return;
    }

    const [[existingTenant]] = await queryInterface.sequelize.query(
      `SELECT 1 FROM "${TENANTS_TABLE}" WHERE id = ${DEFAULT_TENANT_ID} LIMIT 1`,
    );

    if (!existingTenant) {
      await queryInterface.bulkInsert(TENANTS_TABLE, [
        {
          id: DEFAULT_TENANT_ID,
          name: 'Default Tenant',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete(TENANTS_TABLE, { id: DEFAULT_TENANT_ID });
  },
};
