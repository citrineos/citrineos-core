// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const tables = await queryInterface.showAllTables();

    if (!tables.includes('ConnectorTariffs')) {
      await queryInterface.createTable('ConnectorTariffs', {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        connectorOcpiId: {
          type: DataTypes.STRING(36),
          allowNull: false,
        },
        tariffOcpiId: {
          type: DataTypes.STRING(36),
          allowNull: false,
        },
        connectorId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'Connectors',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        tariffId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'Tariffs',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        tenantPartnerId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'TenantPartners',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        tenantId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          references: {
            model: 'Tenants',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      });

      await queryInterface.addConstraint('ConnectorTariffs', {
        fields: ['connectorOcpiId', 'tariffOcpiId', 'tenantPartnerId'],
        type: 'unique',
        name: 'connector_tariffs_unique',
      });

      await queryInterface.addIndex('ConnectorTariffs', ['connectorOcpiId'], {
        name: 'idx_connector_tariffs_connector_ocpi_id',
      });

      await queryInterface.addIndex('ConnectorTariffs', ['tariffOcpiId'], {
        name: 'idx_connector_tariffs_tariff_ocpi_id',
      });

      await queryInterface.addIndex('ConnectorTariffs', ['connectorId'], {
        name: 'idx_connector_tariffs_connector_id',
      });

      await queryInterface.addIndex('ConnectorTariffs', ['tariffId'], {
        name: 'idx_connector_tariffs_tariff_id',
      });

      await queryInterface.addIndex('ConnectorTariffs', ['tenantPartnerId'], {
        name: 'idx_connector_tariffs_tenant_partner_id',
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('ConnectorTariffs')) {
      await queryInterface.dropTable('ConnectorTariffs');
    }
  },
};
