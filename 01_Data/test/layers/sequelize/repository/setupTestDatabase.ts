// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Sequelize } from 'sequelize-typescript';
import {
  Boot,
  Authorization,
  AuthorizationTenant,
  Tenant,
  TenantPartner,
  VariableAttribute,
  VariableCharacteristics,
  Component,
  EvseType,
  Variable,
  VariableStatus,
  LocalListAuthorization,
  LocalListVersion,
  SendLocalList,
  LocalListVersionAuthorization,
  SendLocalListAuthorization,
  StartTransaction,
  StopTransaction,
  Transaction,
  TransactionEvent,
  MeterValue,
  SecurityEvent,
  VariableMonitoring,
  EventData,
  VariableMonitoringStatus,
  ChargingStation,
  Evse,
  ChargingStationNetworkProfile,
  LatestStatusNotification,
  Location,
  ServerNetworkProfile,
  SetNetworkProfile,
  StatusNotification,
  Connector,
  ChargingStationSequence,
  MessageInfo,
  Tariff,
  Subscription,
  Certificate,
  InstalledCertificate,
  ChargingProfile,
  ChargingNeeds,
  ChargingSchedule,
  CompositeSchedule,
  SalesTariff,
  OCPPMessage,
  Reservation,
  ChargingStationSecurityInfo,
  ChangeConfiguration,
  AsyncJobStatus,
  DeleteCertificateAttempt,
  InstallCertificateAttempt,
} from '../../../../src/layers/sequelize/index.js';
import { ComponentVariable } from '../../../../src/layers/sequelize/model/DeviceModel/ComponentVariable.js';
import { Cdr } from '../../../../src/layers/sequelize/model/Cdrs/Cdrs.js';
import { TariffElement } from '../../../../src/layers/sequelize/model/Tariff/TariffElements.js';
import { afterAll, beforeAll } from 'vitest';

const ALL_MODELS = [
  Authorization,
  AuthorizationTenant,
  LocalListAuthorization,
  LocalListVersion,
  SendLocalList,
  LocalListVersionAuthorization,
  SendLocalListAuthorization,
  Tenant,
  TenantPartner,
  Boot,
  Component,
  ComponentVariable,
  EvseType,
  Variable,
  VariableAttribute,
  VariableCharacteristics,
  VariableStatus,
  ChargingStation,
  ChargingStationNetworkProfile,
  Connector,
  Evse,
  LatestStatusNotification,
  Location,
  ServerNetworkProfile,
  SetNetworkProfile,
  StatusNotification,
  StartTransaction,
  StopTransaction,
  Transaction,
  TransactionEvent,
  MeterValue,
  ChargingNeeds,
  ChargingProfile,
  ChargingSchedule,
  CompositeSchedule,
  SalesTariff,
  Certificate,
  DeleteCertificateAttempt,
  InstallCertificateAttempt,
  InstalledCertificate,
  EventData,
  VariableMonitoring,
  VariableMonitoringStatus,
  AsyncJobStatus,
  Cdr,
  ChangeConfiguration,
  ChargingStationSecurityInfo,
  ChargingStationSequence,
  MessageInfo,
  OCPPMessage,
  Reservation,
  SecurityEvent,
  Subscription,
  TariffElement,
  Tariff,
];

export interface TestDatabase {
  sequelize: Sequelize;
  cleanup: () => Promise<void>;
}

export function setupTestDatabase(): TestDatabase {
  let container: any;
  let sequelize: Sequelize;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgis/postgis:16-3.5')
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    sequelize = new Sequelize({
      dialect: 'postgres',
      host: container.getHost(),
      port: container.getPort(),
      database: container.getDatabase(),
      username: container.getUsername(),
      password: container.getPassword(),
      models: ALL_MODELS,
      logging: false,
    });

    await sequelize.query('CREATE EXTENSION IF NOT EXISTS citext;');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await sequelize.sync({ force: true });
  }, 60_000);

  afterAll(async () => {
    await sequelize.close();
    await container.stop();
  });

  // Expose a cleanup helper tests can call in beforeEach
  const cleanup = async () => {
    await sequelize.query(`
      TRUNCATE TABLE
        "AuthorizationTenants", "Authorizations",
        "Tenants", "TenantPartners"
      RESTART IDENTITY CASCADE
    `);
  };

  return {
    get sequelize() {
      return sequelize;
    },
    cleanup,
  };
}
