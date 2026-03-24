'use strict';
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addConstraint('Evses', {
      fields: ['ocpiUid', 'stationId'],
      type: 'unique',
      name: 'evses_ocpi_uid_station_unique',
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint('Evses', 'evses_ocpi_uid_station_unique');
  },
};
