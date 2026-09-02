// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

const TABLE_NAME = 'ServerNetworkProfiles';
const COLUMN_NAME = 'mtlsCertificateAuthorityCertificateFilePath';

export default {
  up: async (queryInterface: QueryInterface) => {
    const table = await queryInterface.describeTable(TABLE_NAME);
    if (table[COLUMN_NAME]) {
      return;
    }

    // Nullable: existing servers keep deriving the CSR-signing issuer from the
    // second entry of tlsCertificateChainFilePath, which is the behaviour they
    // have today. Only a server whose TLS chain is not issued by its own sub CA
    // needs to set this.
    await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    const table = await queryInterface.describeTable(TABLE_NAME);
    if (!table[COLUMN_NAME]) {
      return;
    }
    await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  },
};
