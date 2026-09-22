// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { AuthorizationStatusEnum, IdTokenEnum, OCPP1_6, type SystemConfig } from '@citrineos/types';
import {
  DefaultSequelizeInstance,
  type LocalListVersion,
  SequelizeLocalAuthListRepository,
} from '../../../index.js';
import { Authorization, Tenant } from '@dal/db/sequelize/index.js';
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

type LocalAuthListEntry = NonNullable<
  OCPP1_6.SendLocalListRequest['localAuthorizationList']
>[number];

function add(idTag: string): LocalAuthListEntry {
  return { idTag, idTagInfo: { status: OCPP1_6.SendLocalListRequestStatus.Accepted } };
}

function remove(idTag: string): LocalAuthListEntry {
  return { idTag };
}

async function sendAndAccept(
  repo: SequelizeLocalAuthListRepository,
  updateType: OCPP1_6.SendLocalListRequestUpdateType,
  versionNumber: number,
  entries: LocalAuthListEntry[],
): Promise<LocalListVersion> {
  const sendLocalList = await repo.createSendLocalListFromRequestData16(
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

describe('SequelizeLocalAuthListRepository 1.6 differential removals', () => {
  it('drops an existing tag sent without idTagInfo from the station list', async () => {
    const repo = aRepo();
    await enrol('A', 'B');
    await sendAndAccept(repo, OCPP1_6.SendLocalListRequestUpdateType.Full, 1, [add('A'), add('B')]);

    const version = await sendAndAccept(
      repo,
      OCPP1_6.SendLocalListRequestUpdateType.Differential,
      2,
      [remove('A')],
    );

    expect(idTokensOn(version)).toEqual(['B']);
    expect(version.localAuthorizationList ?? []).not.toContainEqual(
      expect.objectContaining({ idToken: 'A' }),
    );
  });
});
