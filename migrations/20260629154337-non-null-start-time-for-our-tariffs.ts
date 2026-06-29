// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(`
ALTER TABLE "Tariffs"
ADD CONSTRAINT "Tariffs_own_tariff_requires_start_date"
CHECK (
  "tenantPartnerId" IS NOT NULL
  OR "startDateTime" IS NOT NULL
);
    `);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(`
ALTER TABLE "Tariffs"
ADD CONSTRAINT "Tariffs_own_tariff_requires_start_date"
CHECK (
  "tenantPartnerId" IS NOT NULL
  OR "startDateTime" IS NOT NULL
);
    `);
  },
};
