// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

process.env.APP_ENV = 'local';

import { DEFAULT_TENANT_ID, loadBootstrapConfig } from '@citrineos/base';
import { DefaultSequelizeInstance } from '@citrineos/core';

async function initializeDatabase() {
  const bootstrapConfig = loadBootstrapConfig();
  return DefaultSequelizeInstance.getInstance(bootstrapConfig);
}

export const sequelize = initializeDatabase();

const syncDatabase = async () => {
  const db = await sequelize;
  await db.sync({ force: true });
  console.log('Database synchronized successfully');

  // Seed required data that migrations would normally insert.
  const [[existingTenant]] = await db.query(
    `SELECT 1 FROM "Tenants" WHERE id = ${DEFAULT_TENANT_ID} LIMIT 1`,
  );
  if (!existingTenant) {
    await db.query(
      `INSERT INTO "Tenants" (id, name, "createdAt", "updatedAt")
       VALUES (${DEFAULT_TENANT_ID}, 'Default Tenant', NOW(), NOW())`,
    );
    console.log('Default tenant seeded successfully');
  }
};

syncDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  });
