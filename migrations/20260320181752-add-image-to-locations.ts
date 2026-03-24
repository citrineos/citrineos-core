'use strict';
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Locations', 'images', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'images', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Evses', 'images');
    await queryInterface.removeColumn('Locations', 'images');
  },
};
