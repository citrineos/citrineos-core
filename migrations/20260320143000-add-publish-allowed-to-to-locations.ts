'use strict';
import { DataTypes, QueryInterface } from 'sequelize';
export default {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable('Locations');
    if (!tableDescription.publishAllowedTo) {
      await queryInterface.addColumn('Locations', 'publishAllowedTo', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }
  },
  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable('Locations');
    if (tableDescription.publishAllowedTo) {
      await queryInterface.removeColumn('Locations', 'publishAllowedTo');
    }
  },
};
