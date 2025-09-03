import { DataTypes, QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('TenantPartners', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      partyId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      countryCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Tenants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      partnerProfileOCPI: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('TenantPartners');
  },
};
