// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(
    `ALTER TABLE "Certificates" DROP CONSTRAINT IF EXISTS "Certificates_serialNumber_issuerName_key"`,
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.sequelize.query(
    `ALTER TABLE "Certificates" ADD CONSTRAINT "Certificates_serialNumber_issuerName_key" UNIQUE ("serialNumber", "issuerName")`,
  );
}
