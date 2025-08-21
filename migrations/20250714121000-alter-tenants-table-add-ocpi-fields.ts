import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Tenants', 'partyId', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default',
    });
    await queryInterface.addColumn('Tenants', 'countryCode', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'US',
    });
    await queryInterface.addColumn('Tenants', 'serverCredentialsRoles', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Tenants', 'serverVersions', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn('Tenants', 'serverCredential', {
      type: DataTypes.JSONB,
      allowNull: true,
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Tenants', 'partyId');
    await queryInterface.removeColumn('Tenants', 'countryCode');
    await queryInterface.removeColumn('Tenants', 'serverCredentialsRoles');
    await queryInterface.removeColumn('Tenants', 'serverVersions');
    await queryInterface.removeColumn('Tenants', 'serverCredential');
  },
};
