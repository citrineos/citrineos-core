// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize } from 'sequelize-typescript';
import type { BootstrapConfig } from '@citrineos/base';
import { AuthorizationStatusEnum, IdTokenEnum, OCPP2_0_1 } from '@citrineos/types';
import {
  Authorization,
  DefaultSequelizeInstance,
  SequelizeLocalAuthListRepository,
  Tenant,
} from '../../../index.js';

const TENANT_A = 1;
const TENANT_B = 2;
const SHARED_TOKEN = 'SHARED-TAG-001';
const STATION = 'CS001';

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
  await sequelizeInstance.sync({ force: true });
}, 90_000);

afterAll(async () => {
  await sequelizeInstance.close();
  await pgContainer.stop();
});

beforeEach(async () => {
  await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });
  await Tenant.create({ id: TENANT_A as any });
  await Tenant.create({ id: TENANT_B as any });
});

function aRepo(): SequelizeLocalAuthListRepository {
  return new SequelizeLocalAuthListRepository({
    config: {} as BootstrapConfig,
    sequelizeInstance,
  } as never);
}

/** The same idToken enrolled by two operators - the unique index is (tenantId, idToken, type). */
async function enrolSharedTokenForBothTenants() {
  // B is inserted first so it holds the lower id: an unscoped findOne returns it, which is what
  // makes the missing tenant predicate observable rather than accidentally right.
  const acceptedForB = await Authorization.create({
    tenantId: TENANT_B,
    idToken: SHARED_TOKEN,
    idTokenType: IdTokenEnum.ISO14443,
    status: AuthorizationStatusEnum.Accepted,
  } as any);
  const blockedForA = await Authorization.create({
    tenantId: TENANT_A,
    idToken: SHARED_TOKEN,
    idTokenType: IdTokenEnum.ISO14443,
    status: AuthorizationStatusEnum.Blocked,
  } as any);
  return { blockedForA, acceptedForB };
}

const authorizationData = [
  {
    idToken: { idToken: SHARED_TOKEN, type: IdTokenEnum.ISO14443 },
  },
] as unknown as OCPP2_0_1.AuthorizationData[];

describe('SequelizeLocalAuthListRepository tenant scoping', () => {
  it("builds a station's local list from its own tenant's authorization", async () => {
    // The list is copied into LocalListAuthorization and sent to the charger to use while it is
    // offline. Resolving the idToken without the tenant hands one operator's charger another
    // operator's authorization status.
    const { blockedForA } = await enrolSharedTokenForBothTenants();

    const sendLocalList = await aRepo().createSendLocalListFromRequestData(
      TENANT_A,
      STATION,
      'corr-1',
      OCPP2_0_1.UpdateEnumType.Full,
      1,
      authorizationData,
    );

    const [entry] = sendLocalList.localAuthorizationList!;
    expect(Number(entry.authorizationId)).toBe(blockedForA.id);
    expect(entry.status).toBe(AuthorizationStatusEnum.Blocked);
  });

  it('refuses when the tenant has no authorization for the token, even if another tenant does', async () => {
    await Authorization.create({
      tenantId: TENANT_B,
      idToken: SHARED_TOKEN,
      idTokenType: IdTokenEnum.ISO14443,
      status: AuthorizationStatusEnum.Accepted,
    } as any);

    await expect(
      aRepo().createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-2',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        authorizationData,
      ),
    ).rejects.toThrow(/Authorization not found/);
  });
});
