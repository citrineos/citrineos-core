'use strict';
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable('Locations');
    if (!tableDescription.energyMix) {
      await queryInterface.addColumn('Locations', 'energyMix', {
        type: DataTypes.JSONB,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface: QueryInterface) => {
    const tableDescription = await queryInterface.describeTable('Locations');
    if (tableDescription.energyMix) {
      await queryInterface.removeColumn('Locations', 'energyMix');
    }
  },
};
