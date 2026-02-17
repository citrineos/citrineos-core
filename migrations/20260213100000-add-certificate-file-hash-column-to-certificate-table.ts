import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn('Certificates', 'certificateFileHash', {
    type: DataTypes.STRING,
    unique: true,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn('Certificates', 'certificateFileHash');
}
