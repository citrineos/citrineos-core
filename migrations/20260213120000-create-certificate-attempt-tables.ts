import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('InstallCertificateAttempts', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    stationId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'ChargingStations',
        key: 'id',
      },
    },
    certificateType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    certificateId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Certificates',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.STRING,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
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

  await queryInterface.createTable('DeleteCertificateAttempts', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    stationId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'ChargingStations',
        key: 'id',
      },
    },
    hashAlgorithm: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    issuerNameHash: {
      type: DataTypes.STRING,
    },
    issuerKeyHash: {
      type: DataTypes.STRING,
    },
    serialNumber: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
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
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('DeleteCertificateAttempts');
  await queryInterface.dropTable('InstallCertificateAttempts');
}
