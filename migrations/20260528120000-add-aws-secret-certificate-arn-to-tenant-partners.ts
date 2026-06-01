// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "TenantPartners"
      ADD COLUMN IF NOT EXISTS "awsSecretCertificateArn" VARCHAR(255);
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "TenantPartners"
      DROP COLUMN IF EXISTS "awsSecretCertificateArn";
    `);
  },
};
