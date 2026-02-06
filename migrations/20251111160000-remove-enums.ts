// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.changeColumn('InstalledCertificates', 'certificateType', {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_InstalledCertificates_certificateType";
    `);

    await queryInterface.changeColumn('Connectors', 'status', {
      type: DataTypes.STRING,
    });
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_Connectors_status";
    `);
    // Default value references enum type, since default value is changed before column type, so we had to change the column to STRING first.
    await queryInterface.changeColumn('Connectors', 'status', {
      type: DataTypes.STRING,
      defaultValue: 'Unknown',
    });

    await queryInterface.changeColumn('Connectors', 'errorCode', {
      type: DataTypes.STRING,
    });
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_Connectors_errorCode";
    `);
    // Default value references enum type, since default value is changed before column type, so we had to change the column to STRING first.
    await queryInterface.changeColumn('Connectors', 'errorCode', {
      type: DataTypes.STRING,
      defaultValue: 'NoError',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
        DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_type WHERE typname = 'enum_InstalledCertificates_certificateType'
            ) THEN
              CREATE TYPE "enum_InstalledCertificates_certificateType" AS ENUM (
                'V2GRootCertificate', 
                'MORootCertificate', 
                'CSMSRootCertificate', 
                'V2GCertificateChain', 
                'ManufacturerRootCertificate'
              );
            END IF;
          END$$;
          
        DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_type WHERE typname = 'enum_Connectors_status'
            ) THEN
              CREATE TYPE "enum_Connectors_status" AS ENUM (
                'Available',
                'Preparing',
                'Charging',
                'SuspendedEVSE',
                'SuspendedEV',
                'Finishing',
                'Reserved',
                'Unavailable',
                'Faulted'
              );
            END IF;
          END$$;
          
        DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_type WHERE typname = 'enum_Connectors_errorCode'
            ) THEN
              CREATE TYPE "enum_Connectors_errorCode" AS ENUM (
                'ConnectorLockFailure', 
                'EVCommunicationError',
                'GroundFailure',
                'HighTemperature',
                'InternalError',
                'LocalListConflict',
                'NoError',
                'OtherError',
                'OverCurrentFailure',
                'PowerMeterFailure',
                'PowerSwitchFailure',
                'ReaderFailure',
                'ResetFailure',
                'UnderVoltage',
                'OverVoltage',
                'WeakSignal'
              );
            END IF;
          END$$;
        `);

    await queryInterface.changeColumn('InstalledCertificates', 'certificateType', {
      type: DataTypes.ENUM(
        'V2GRootCertificate',
        'MORootCertificate',
        'CSMSRootCertificate',
        'V2GCertificateChain',
        'ManufacturerRootCertificate',
      ),
      allowNull: false,
    });

    await queryInterface.changeColumn('Connectors', 'status', {
      type: DataTypes.ENUM(
        'Available',
        'Preparing',
        'Charging',
        'SuspendedEVSE',
        'SuspendedEV',
        'Finishing',
        'Reserved',
        'Unavailable',
        'Faulted',
      ),
      allowNull: false,
      defaultValue: 'Unknown',
    });

    await queryInterface.changeColumn('Connectors', 'errorCode', {
      type: DataTypes.ENUM(
        'ConnectorLockFailure',
        'EVCommunicationError',
        'GroundFailure',
        'HighTemperature',
        'InternalError',
        'LocalListConflict',
        'NoError',
        'OtherError',
        'OverCurrentFailure',
        'PowerMeterFailure',
        'PowerSwitchFailure',
        'ReaderFailure',
        'ResetFailure',
        'UnderVoltage',
        'OverVoltage',
        'WeakSignal',
      ),
      allowNull: false,
      defaultValue: 'NoError',
    });
  },
};
