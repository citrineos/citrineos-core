'use strict';

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { QueryInterface } from 'sequelize';
import { Tenant } from '@citrineos/data';

const TENANTS_TABLE = `${Tenant.MODEL_NAME}s`;

export = {
  up: async (queryInterface: QueryInterface) => {
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
