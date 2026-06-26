// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import type { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(`
        ALTER TABLE "Authorizations" ALTER COLUMN status DROP DEFAULT;
        CREATE TYPE authorization_status AS ENUM (
        'Accepted', 'Blocked', 'ConcurrentTx', 'Expired',
        'Invalid', 'NoCredit', 'NotAllowedTypeEVSE',
        'NotAtThisLocation', 'NotAtThisTime', 'Unknown'
        );
        ALTER TABLE "Authorizations"
        ALTER COLUMN status TYPE authorization_status
        USING status::authorization_status;
        ALTER TABLE "Authorizations"
        ALTER COLUMN status SET DEFAULT 'Accepted'::authorization_status;
    `);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query(`
ALTER TABLE "Authorizations" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "Authorizations"
  ALTER COLUMN status TYPE VARCHAR(255)
  USING status::VARCHAR;
ALTER TABLE "Authorizations"
  ALTER COLUMN status SET DEFAULT 'Accepted';
DROP TYPE IF EXISTS authorization_status;
    `);
  },
};
