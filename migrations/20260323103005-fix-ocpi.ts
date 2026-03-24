'use strict';
import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    // Remove the index created by previous migration
    await queryInterface.removeIndex('Locations', 'locations_ocpi_id_partner_unique');
    // Add a proper UNIQUE CONSTRAINT (required by Hasura on_conflict)
    await queryInterface.addConstraint('Locations', {
      fields: ['ocpiId', 'ownerTenantPartnerId'],
      type: 'unique',
      name: 'locations_ocpi_id_partner_unique',
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeConstraint('Locations', 'locations_ocpi_id_partner_unique');
  },
};
