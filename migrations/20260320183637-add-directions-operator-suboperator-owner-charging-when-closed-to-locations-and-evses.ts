'use strict';
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Locations', 'directions', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Locations', 'operator', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Locations', 'suboperator', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Locations', 'owner', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Locations', 'chargingWhenClosed', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'directions', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Locations', 'directions');
    await queryInterface.removeColumn('Locations', 'operator');
    await queryInterface.removeColumn('Locations', 'suboperator');
    await queryInterface.removeColumn('Locations', 'owner');
    await queryInterface.removeColumn('Locations', 'chargingWhenClosed');
    await queryInterface.removeColumn('Evses', 'directions');
  },
};
