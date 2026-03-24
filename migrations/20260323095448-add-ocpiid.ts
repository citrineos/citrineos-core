'use strict';
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable('Locations');
    if (!tableDescription.ocpiId) {
      await queryInterface.addColumn('Locations', 'ocpiId', {
        type: DataTypes.STRING(36),
        allowNull: true,
      });

      await queryInterface.addIndex('Locations', ['ocpiId', 'ownerTenantPartnerId'], {
        unique: true,
        name: 'locations_ocpi_id_partner_unique',
        where: {
          ocpiId: { [Symbol.for('ne')]: null },
        },
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable('Locations');
    if (tableDescription.ocpiId) {
      await queryInterface.removeIndex('Locations', 'locations_ocpi_id_partner_unique');
      await queryInterface.removeColumn('Locations', 'ocpiId');
    }
  },
};
