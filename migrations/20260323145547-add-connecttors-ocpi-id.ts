'use strict';
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Connectors', 'ocpiId', {
      type: DataTypes.STRING(36),
      allowNull: true,
    });
    await queryInterface.addConstraint('Connectors', {
      fields: ['ocpiId', 'evseId'],
      type: 'unique',
      name: 'connectors_ocpi_id_evse_unique',
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint('Connectors', 'connectors_ocpi_id_evse_unique');
    await queryInterface.removeColumn('Connectors', 'ocpiId');
  },
};
