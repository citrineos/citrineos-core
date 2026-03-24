'use strict';
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Evses', 'floorLevel', {
      type: DataTypes.STRING(4),
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'coordinates', {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'parkingRestrictions', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'statusSchedule', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Evses', 'ocpiUid', {
      type: DataTypes.STRING(36),
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Evses', 'floorLevel');
    await queryInterface.removeColumn('Evses', 'coordinates');
    await queryInterface.removeColumn('Evses', 'parkingRestrictions');
    await queryInterface.removeColumn('Evses', 'statusSchedule');
    await queryInterface.removeColumn('Evses', 'ocpiUid');
  },
};
