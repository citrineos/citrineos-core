// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AuthorizationStatusEnum,
  IdTokenEnum,
  OCPP2_0_1,
  type SystemConfig,
} from '@citrineos/types';
import {
  Authorization,
  DefaultSequelizeInstance,
  type LocalListVersion,
  SequelizeLocalAuthListRepository,
  Tenant,
} from '../../../index.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const TENANT = 1;
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
  } as unknown as SystemConfig;

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
  await Tenant.create({ id: TENANT as any, name: String(TENANT) });
});

function aRepo(): SequelizeLocalAuthListRepository {
  return new SequelizeLocalAuthListRepository({
    config: {} as SystemConfig,
    sequelizeInstance,
  } as never);
}

async function enrol(...idTokens: string[]) {
  for (const idToken of idTokens) {
    await Authorization.create({
      tenantId: TENANT,
      idToken,
      idTokenType: IdTokenEnum.ISO14443,
      status: AuthorizationStatusEnum.Accepted,
    } as any);
  }
}

function add(idToken: string): OCPP2_0_1.AuthorizationData {
  return {
    idToken: { idToken, type: OCPP2_0_1.IdTokenEnumType.ISO14443 },
    idTokenInfo: { status: OCPP2_0_1.AuthorizationStatusEnumType.Accepted },
  };
}

function remove(idToken: string): OCPP2_0_1.AuthorizationData {
  return { idToken: { idToken, type: OCPP2_0_1.IdTokenEnumType.ISO14443 } };
}

async function sendAndAccept(
  repo: SequelizeLocalAuthListRepository,
  updateType: OCPP2_0_1.UpdateEnumType,
  versionNumber: number,
  entries: OCPP2_0_1.AuthorizationData[],
): Promise<LocalListVersion> {
  const sendLocalList = await repo.createSendLocalListFromRequestData(
    TENANT,
    STATION,
    `corr-${versionNumber}`,
    updateType,
    versionNumber,
    entries,
  );
  return repo.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
    TENANT,
    STATION,
    sendLocalList,
  );
}

function idTokensOn(version: LocalListVersion): string[] {
  return (version.localAuthorizationList ?? []).map((auth) => auth.idToken).sort();
}

describe('SequelizeLocalAuthListRepository differential removals', () => {
  it('drops a token sent without idTokenInfo from the station list', async () => {
    const repo = aRepo();
    await enrol('A', 'B', 'C');
    await sendAndAccept(repo, OCPP2_0_1.UpdateEnumType.Full, 1, [add('A'), add('B'), add('C')]);

    const version = await sendAndAccept(repo, OCPP2_0_1.UpdateEnumType.Differential, 2, [
      remove('C'),
    ]);

    expect(idTokensOn(version)).toEqual(['A', 'B']);
  });

  it('still refuses to add a token that has no authorization', async () => {
    const repo = aRepo();
    await enrol('A');
    await sendAndAccept(repo, OCPP2_0_1.UpdateEnumType.Full, 1, [add('A')]);

    await expect(
      repo.createSendLocalListFromRequestData(
        TENANT,
        STATION,
        'corr-2',
        OCPP2_0_1.UpdateEnumType.Differential,
        2,
        [add('UNKNOWN')],
      ),
    ).rejects.toThrow(/Authorization not found/);
  });
});
