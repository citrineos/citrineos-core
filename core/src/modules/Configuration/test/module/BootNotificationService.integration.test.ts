// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig, ICache, SystemConfig } from '@citrineos/base';
import { DEFAULT_TENANT_ID, OCPP2_0_1 } from '@citrineos/base';
import { BootNotificationService } from '../../src/module/BootNotificationService.js';
import { DefaultSequelizeInstance } from '../../../../dal/layers/sequelize/util';
import { Component } from '../../../../dal/layers/sequelize/model/DeviceModel/Component';
import { Variable } from '../../../../dal/layers/sequelize/model/DeviceModel/Variable';
import { VariableAttribute } from '../../../../dal/layers/sequelize/model/DeviceModel/VariableAttribute';
import { Boot } from '../../../../dal/layers/sequelize/model/Boot';
import { ChargingStation } from '../../../../dal/layers/sequelize/model/Location/ChargingStation';
import { Tenant } from '../../../../dal/layers/sequelize/model/Tenant';
import { SequelizeBootRepository } from '../../../../dal/layers/sequelize/repository/Boot';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_ID = DEFAULT_TENANT_ID;
const STATION_ID = 'CS-BOOT-001';

type Configuration = SystemConfig['modules']['configuration'];

// ---------------------------------------------------------------------------
// Container & DB lifecycle
// ---------------------------------------------------------------------------

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;

beforeAll(async () => {
  pgContainer = await new GenericContainer('postgis/postgis:16-3.4-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'citrineos_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections', 2))
    .start();

  const dbConfig = {
    database: {
      host: pgContainer.getHost(),
      port: pgContainer.getMappedPort(5432),
      database: 'citrineos_test',
      dialect: 'postgres',
      username: 'test',
      password: 'test',
      sync: false,
      alter: false,
      force: false,
      maxRetries: 1,
      retryDelay: 100,
    },
  } as unknown as BootstrapConfig;

  sequelizeInstance = DefaultSequelizeInstance.getInstance(dbConfig);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');

  // The Certificate model has a known type mismatch on its self-referential FK
  // (signedBy VARCHAR vs id INTEGER). All other tables are created correctly
  // before this constraint fails, so we catch and ignore that specific error.
  try {
    await sequelizeInstance.sync({ force: true });
  } catch (e: any) {
    if (!e.message?.includes('Certificates_signedBy_fkey')) throw e;
  }
}, 90_000);

afterAll(async () => {
  await sequelizeInstance.close();
  await pgContainer.stop();
});

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
});

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedBase(): Promise<void> {
  await Tenant.create({ id: TENANT_ID as any });
  await ChargingStation.create({ id: STATION_ID, isOnline: false, tenantId: TENANT_ID });
}

async function seedPendingBoot(): Promise<Boot> {
  return Boot.create({
    id: STATION_ID,
    status: OCPP2_0_1.RegistrationStatusEnumType.Pending,
    getBaseReportOnPending: false,
    tenantId: TENANT_ID,
  });
}

async function seedComponent(): Promise<Component> {
  return Component.create({ name: 'TestComponent', tenantId: TENANT_ID });
}

async function seedVariable(): Promise<Variable> {
  return Variable.create({ name: 'TestVariable', tenantId: TENANT_ID });
}

async function seedVariableAttributeLinkedToBoot(
  componentId: number,
  variableId: number,
  bootId: string,
): Promise<VariableAttribute> {
  return VariableAttribute.create({
    stationId: STATION_ID,
    componentId,
    variableId,
    dataType: OCPP2_0_1.DataEnumType.string,
    value: 'HeartbeatInterval',
    type: OCPP2_0_1.AttributeEnumType.Actual,
    generatedAt: new Date(),
    bootConfigId: bootId,
    tenantId: TENANT_ID,
  });
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

function makeBootService(autoAccept = false): BootNotificationService {
  const mockCache: ICache = {
    onChange: vi.fn(),
    remove: vi.fn(),
    set: vi.fn(),
  } as unknown as ICache;

  const mockConfig: Configuration = {
    bootRetryInterval: 30,
    endpointPrefix: '',
    heartbeatInterval: 60,
    requests: [],
    responses: [],
    ocpp2_0_1: {
      unknownChargerStatus: OCPP2_0_1.RegistrationStatusEnumType.Rejected,
      getBaseReportOnPending: false,
      bootWithRejectedVariables: false,
      autoAccept,
    },
  } as unknown as Configuration;

  const bootRepo = new SequelizeBootRepository({} as BootstrapConfig, undefined, sequelizeInstance);

  return new BootNotificationService(bootRepo, mockCache, mockConfig);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BootNotificationService – createBootNotificationResponse integration', () => {
  describe('pendingBootSetVariables loaded via readByKey', () => {
    it('returns Pending when a VariableAttribute with bootConfigId is in the DB', async () => {
      await seedBase();
      const boot = await seedPendingBoot();
      const component = await seedComponent();
      const variable = await seedVariable();
      await seedVariableAttributeLinkedToBoot(component.id, variable.id, boot.id);

      const bootService = makeBootService();
      const response = await bootService.createBootNotificationResponse(TENANT_ID, STATION_ID);

      expect(response.status).toBe(OCPP2_0_1.RegistrationStatusEnumType.Pending);
    });

    it('returns Accepted (autoAccept=true) when no VariableAttributes are linked to the boot', async () => {
      await seedBase();
      await seedPendingBoot();

      const bootService = makeBootService(true);
      const response = await bootService.createBootNotificationResponse(TENANT_ID, STATION_ID);

      expect(response.status).toBe(OCPP2_0_1.RegistrationStatusEnumType.Accepted);
    });

    it('returns Rejected for an unknown charger (no Boot record in DB)', async () => {
      await seedBase();

      const bootService = makeBootService();
      const response = await bootService.createBootNotificationResponse(TENANT_ID, STATION_ID);

      expect(response.status).toBe(OCPP2_0_1.RegistrationStatusEnumType.Rejected);
    });

    it('pendingBootSetVariables loads via explicit include when linked attributes exist', async () => {
      await seedBase();
      const boot = await seedPendingBoot();
      const component = await seedComponent();
      const variable = await seedVariable();
      await seedVariableAttributeLinkedToBoot(component.id, variable.id, boot.id);

      const bootConfig = await Boot.findByPk(STATION_ID, {
        include: [{ model: VariableAttribute, as: 'pendingBootSetVariables' }],
      });

      expect(bootConfig).not.toBeNull();
      expect(bootConfig!.pendingBootSetVariables).toBeDefined();
      expect(bootConfig!.pendingBootSetVariables!.length).toBeGreaterThan(0);
    });
  });
});
