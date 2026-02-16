import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('InstalledCertificates', 'certificateId', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Certificates',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn('InstalledCertificates', 'certificateId');
}
