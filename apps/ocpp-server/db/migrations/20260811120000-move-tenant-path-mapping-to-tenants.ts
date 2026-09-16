// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

// Tenant path mappings used to live on ServerNetworkProfiles as a per-server
// { path: tenantId } JSONB map. They now live on the tenant itself: a tenant has at
// most one path, and every server with dynamicTenantResolution enabled resolves
// against it. Existing per-server mappings are dropped, not migrated: they were
// server-scoped and could map the same path to different tenants on different servers,
// so there is no safe automatic conversion. Re-create them via the websocket mapping API.
export default {
  up: async (queryInterface: QueryInterface) => {
    const tenants = await queryInterface.describeTable('Tenants');

    if (!tenants.tenantWebsocketServerPath) {
      await queryInterface.addColumn('Tenants', 'tenantWebsocketServerPath', {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment:
          'URL path segment this tenant is reachable under on websocket servers with dynamic tenant resolution',
      });
    }

    const serverNetworkProfiles = await queryInterface.describeTable('ServerNetworkProfiles');

    if (serverNetworkProfiles.tenantPathMapping) {
      await queryInterface.removeColumn('ServerNetworkProfiles', 'tenantPathMapping');
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const serverNetworkProfiles = await queryInterface.describeTable('ServerNetworkProfiles');

    if (!serverNetworkProfiles.tenantPathMapping) {
      await queryInterface.addColumn('ServerNetworkProfiles', 'tenantPathMapping', {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Mapping of URL path segments to tenant IDs',
      });
    }

    await queryInterface.removeColumn('Tenants', 'tenantWebsocketServerPath');
  },
};
