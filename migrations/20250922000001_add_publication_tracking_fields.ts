// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Add publication tracking fields to Location table
  await queryInterface.addColumn('Locations', 'isPublished', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  await queryInterface.addColumn('Locations', 'validationErrors', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('Locations', 'publishedToPartners', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('Locations', 'lastPublicationAttempt', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  // Add publication tracking fields to Evse table
  await queryInterface.addColumn('Evses', 'isPublished', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  await queryInterface.addColumn('Evses', 'validationErrors', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('Evses', 'publishedToPartners', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('Evses', 'lastPublicationAttempt', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  // Add publication tracking fields to Connector table
  await queryInterface.addColumn('Connectors', 'isPublished', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  await queryInterface.addColumn('Connectors', 'validationErrors', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('Connectors', 'publishedToPartners', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('Connectors', 'lastPublicationAttempt', {
    type: DataTypes.DATE,
    allowNull: true,
  });

  // Add publication tracking fields to Tariff table
  await queryInterface.addColumn('Tariffs', 'isPublished', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  });

  await queryInterface.addColumn('Tariffs', 'validationErrors', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('Tariffs', 'publishedToPartners', {
    type: DataTypes.JSONB,
    allowNull: true,
  });

  await queryInterface.addColumn('Tariffs', 'lastPublicationAttempt', {
    type: DataTypes.DATE,
    allowNull: true,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Remove publication tracking fields from Location table
  await queryInterface.removeColumn('Locations', 'isPublished');
  await queryInterface.removeColumn('Locations', 'validationErrors');
  await queryInterface.removeColumn('Locations', 'publishedToPartners');
  await queryInterface.removeColumn('Locations', 'lastPublicationAttempt');

  // Remove publication tracking fields from Evse table
  await queryInterface.removeColumn('Evses', 'isPublished');
  await queryInterface.removeColumn('Evses', 'validationErrors');
  await queryInterface.removeColumn('Evses', 'publishedToPartners');
  await queryInterface.removeColumn('Evses', 'lastPublicationAttempt');

  // Remove publication tracking fields from Connector table
  await queryInterface.removeColumn('Connectors', 'isPublished');
  await queryInterface.removeColumn('Connectors', 'validationErrors');
  await queryInterface.removeColumn('Connectors', 'publishedToPartners');
  await queryInterface.removeColumn('Connectors', 'lastPublicationAttempt');

  // Remove publication tracking fields from Tariff table
  await queryInterface.removeColumn('Tariffs', 'isPublished');
  await queryInterface.removeColumn('Tariffs', 'validationErrors');
  await queryInterface.removeColumn('Tariffs', 'publishedToPartners');
  await queryInterface.removeColumn('Tariffs', 'lastPublicationAttempt');
}
