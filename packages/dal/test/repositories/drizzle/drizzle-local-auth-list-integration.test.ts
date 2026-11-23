// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import {
  AuthorizationStatusEnum,
  IdTokenEnum,
  OCPP1_6,
  OCPP2_0_1,
  type LocalListVersionDto,
} from '@citrineos/types';
import { Authorization } from '@dal/db/sequelize/index.js';
import { LocalListAuthorization } from '@dal/models/authorization/local-list-authorization.js';
import { LocalListVersion } from '@dal/models/authorization/local-list-version.js';
import { SendLocalList } from '@dal/models/authorization/send-local-list.js';
import { DrizzleLocalListVersionRepository } from '@dal/repositories/drizzle/local-list-version.js';
import { DrizzleSendLocalListRepository } from '@dal/repositories/drizzle/send-local-list.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// The drizzle twin of local-auth-list-integration.test.ts and its differential suites.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'cp001';
const OTHER_STATION = 'cp002';

let h: PgHarness;
let drizzlePool: pg.Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  h = await startPgHarness();
  drizzlePool = new pg.Pool({
    host: h.config.database.host,
    port: h.config.database.port,
    database: h.config.database.database,
    user: h.config.database.username,
    password: h.config.database.password,
  });
  drizzlePool.on('error', () => {});
  db = drizzle(drizzlePool);
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await h?.stop();
}, 90_000);

beforeEach(async () => {
  await resetDb(h);
});

function sendListRepo(): DrizzleSendLocalListRepository {
  return new DrizzleSendLocalListRepository({ config: h.config, drizzleInstance: db });
}

function versionRepo(): DrizzleLocalListVersionRepository {
  return new DrizzleLocalListVersionRepository({ config: h.config, drizzleInstance: db });
}

async function enrol(idToken: string, tenantId = TENANT_A): Promise<Authorization> {
  return Authorization.create({
    tenantId,
    idToken,
    idTokenType: IdTokenEnum.ISO14443,
    status: AuthorizationStatusEnum.Accepted,
  } as never);
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
  updateType: OCPP2_0_1.UpdateEnumType,
  versionNumber: number,
  entries: OCPP2_0_1.AuthorizationData[],
): Promise<LocalListVersionDto> {
  const sendLocalList = await sendListRepo().createSendLocalListFromRequestData(
    TENANT_A,
    STATION,
    `corr-${versionNumber}`,
    updateType,
    versionNumber,
    entries,
  );
  return versionRepo().createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
    TENANT_A,
    STATION,
    sendLocalList,
  );
}

function idTokensOn(version: LocalListVersionDto): string[] {
  return (version.localAuthorizationList ?? []).map((auth) => auth.idToken).sort();
}

describe('DrizzleSendLocalListRepository createSendLocalListFromRequestData', () => {
  it('snapshots each enrolled authorization and links it to the request', async () => {
    await enrol('A');
    await enrol('B');

    const sendLocalList = await sendListRepo().createSendLocalListFromRequestData(
      TENANT_A,
      STATION,
      'corr-1',
      OCPP2_0_1.UpdateEnumType.Full,
      1,
      [add('A'), add('B')],
    );

    expect(sendLocalList.correlationId).toBe('corr-1');
    expect(sendLocalList.versionNumber).toBe(1);
    expect(sendLocalList.updateType).toBe(OCPP2_0_1.UpdateEnumType.Full);
    expect((sendLocalList.localAuthorizationList ?? []).map((a) => a.idToken).sort()).toEqual([
      'A',
      'B',
    ]);
    // The snapshot is a copy, keyed back to the Authorization it was taken from.
    const stored = await LocalListAuthorization.findAll({ where: { tenantId: TENANT_A } });
    expect(stored).toHaveLength(2);
    expect(stored.every((row) => row.authorizationId != null)).toBe(true);
    expect(stored.every((row) => row.idTokenType === IdTokenEnum.ISO14443)).toBe(true);
  });

  it('rejects an unknown idToken and rolls the whole request back', async () => {
    await enrol('A');

    await expect(
      sendListRepo().createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-1',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        [add('A'), add('MISSING')],
      ),
    ).rejects.toThrow(/Authorization not found/);

    // Atomic: the SendLocalList row and the snapshot taken for 'A' are both gone.
    expect(await SendLocalList.count({ where: { tenantId: TENANT_A } })).toBe(0);
    expect(await LocalListAuthorization.count({ where: { tenantId: TENANT_A } })).toBe(0);
  });

  it('records a differential entry without idTokenInfo as an unlinked tombstone', async () => {
    const sendLocalList = await sendListRepo().createSendLocalListFromRequestData(
      TENANT_A,
      STATION,
      'corr-2',
      OCPP2_0_1.UpdateEnumType.Differential,
      2,
      [remove('GONE')],
    );

    const [tombstone] = sendLocalList.localAuthorizationList ?? [];
    expect(tombstone.idToken).toBe('GONE');
    expect(tombstone.status).toBe('Invalid');
    expect(tombstone.authorizationId).toBeUndefined();
  });

  it('rejects a groupIdToken that does not match the stored groupAuthorizationId', async () => {
    await enrol('GROUP');
    await enrol('A');

    await expect(
      sendListRepo().createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-1',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        [
          {
            idToken: { idToken: 'A', type: OCPP2_0_1.IdTokenEnumType.ISO14443 },
            idTokenInfo: {
              status: OCPP2_0_1.AuthorizationStatusEnumType.Accepted,
              groupIdToken: { idToken: 'GROUP', type: OCPP2_0_1.IdTokenEnumType.ISO14443 },
            },
          },
        ],
      ),
    ).rejects.toThrow(/does not match groupAuthorizationId/);
  });
});

describe('DrizzleSendLocalListRepository createSendLocalListFromRequestData16', () => {
  it('resolves by flat idTag and takes status and expiry from the request', async () => {
    await enrol('A');
    const expiry = '2030-01-01T00:00:00.000Z';

    const sendLocalList = await sendListRepo().createSendLocalListFromRequestData16(
      TENANT_A,
      STATION,
      'corr-1',
      OCPP1_6.SendLocalListRequestUpdateType.Full,
      1,
      [
        {
          idTag: 'A',
          idTagInfo: { status: OCPP1_6.SendLocalListRequestStatus.Blocked, expiryDate: expiry },
        },
      ],
    );

    const [snapshot] = sendLocalList.localAuthorizationList ?? [];
    expect(snapshot.idToken).toBe('A');
    // 1.6 carries no IdTokenEnumType.
    expect(snapshot.idTokenType).toBeNull();
    expect(snapshot.status).toBe(AuthorizationStatusEnum.Blocked);
    expect(snapshot.cacheExpiryDateTime).toBe(expiry);
  });

  it('resolves parentIdTag onto groupAuthorizationId', async () => {
    const parent = await enrol('PARENT');
    await enrol('A');

    const sendLocalList = await sendListRepo().createSendLocalListFromRequestData16(
      TENANT_A,
      STATION,
      'corr-1',
      OCPP1_6.SendLocalListRequestUpdateType.Full,
      1,
      [
        {
          idTag: 'A',
          idTagInfo: {
            status: OCPP1_6.SendLocalListRequestStatus.Accepted,
            parentIdTag: 'PARENT',
          },
        },
      ],
    );

    const [snapshot] = sendLocalList.localAuthorizationList ?? [];
    expect(snapshot.groupAuthorizationId).toBe(parent.id);
  });

  it('an idTag matching several Authorizations takes one rather than failing', async () => {
    // The unique index spans (idToken, idTokenType, tenantId), so the same idTag can
    // exist under two token types. 1.6 has no token type to disambiguate with.
    await enrol('A');
    await Authorization.create({
      tenantId: TENANT_A,
      idToken: 'A',
      idTokenType: IdTokenEnum.Central,
      status: AuthorizationStatusEnum.Accepted,
    } as never);

    const sendLocalList = await sendListRepo().createSendLocalListFromRequestData16(
      TENANT_A,
      STATION,
      'corr-1',
      OCPP1_6.SendLocalListRequestUpdateType.Full,
      1,
      [{ idTag: 'A', idTagInfo: { status: OCPP1_6.SendLocalListRequestStatus.Accepted } }],
    );

    const [snapshot] = sendLocalList.localAuthorizationList ?? [];
    expect(snapshot.idToken).toBe('A');
    expect(snapshot.authorizationId).toBeDefined();
  });

  it('rejects an unknown parentIdTag', async () => {
    await enrol('A');

    await expect(
      sendListRepo().createSendLocalListFromRequestData16(
        TENANT_A,
        STATION,
        'corr-1',
        OCPP1_6.SendLocalListRequestUpdateType.Full,
        1,
        [
          {
            idTag: 'A',
            idTagInfo: {
              status: OCPP1_6.SendLocalListRequestStatus.Accepted,
              parentIdTag: 'NOBODY',
            },
          },
        ],
      ),
    ).rejects.toThrow(/Parent authorization not found/);
  });
});

describe('DrizzleLocalListVersionRepository createOrUpdateLocalListVersionFromStationIdAndSendLocalList', () => {
  it('Full replaces the station list and its links', async () => {
    await enrol('A');
    await enrol('B');
    await enrol('C');

    await sendAndAccept(OCPP2_0_1.UpdateEnumType.Full, 1, [add('A'), add('B')]);
    const second = await sendAndAccept(OCPP2_0_1.UpdateEnumType.Full, 2, [add('C')]);

    expect(second.versionNumber).toBe(2);
    expect(idTokensOn(second)).toEqual(['C']);
    // The old version row is replaced rather than accumulated.
    expect(await LocalListVersion.count({ where: { tenantId: TENANT_A } })).toBe(1);
  });

  it('Differential adds an entry and keeps the existing ones', async () => {
    await enrol('A');
    await enrol('B');

    await sendAndAccept(OCPP2_0_1.UpdateEnumType.Full, 1, [add('A')]);
    const updated = await sendAndAccept(OCPP2_0_1.UpdateEnumType.Differential, 2, [add('B')]);

    expect(updated.versionNumber).toBe(2);
    expect(idTokensOn(updated)).toEqual(['A', 'B']);
  });

  it('Differential drops a tag sent without idTokenInfo', async () => {
    await enrol('A');
    await enrol('B');

    await sendAndAccept(OCPP2_0_1.UpdateEnumType.Full, 1, [add('A'), add('B')]);
    const updated = await sendAndAccept(OCPP2_0_1.UpdateEnumType.Differential, 2, [remove('A')]);

    expect(idTokensOn(updated)).toEqual(['B']);
  });

  it('Differential re-sending a tag replaces its entry rather than duplicating it', async () => {
    await enrol('A');

    await sendAndAccept(OCPP2_0_1.UpdateEnumType.Full, 1, [add('A')]);
    const updated = await sendAndAccept(OCPP2_0_1.UpdateEnumType.Differential, 2, [add('A')]);

    expect(idTokensOn(updated)).toEqual(['A']);
  });

  it('Differential with no entries only moves the version number', async () => {
    await enrol('A');

    await sendAndAccept(OCPP2_0_1.UpdateEnumType.Full, 1, [add('A')]);
    const updated = await sendAndAccept(OCPP2_0_1.UpdateEnumType.Differential, 5, []);

    expect(updated.versionNumber).toBe(5);
    expect(idTokensOn(updated)).toEqual(['A']);
  });

  it('Differential against a station with no list throws', async () => {
    await enrol('A');
    const sendLocalList = await sendListRepo().createSendLocalListFromRequestData(
      TENANT_A,
      STATION,
      'corr-1',
      OCPP2_0_1.UpdateEnumType.Differential,
      1,
      [add('A')],
    );

    await expect(
      versionRepo().createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
        TENANT_A,
        STATION,
        sendLocalList,
      ),
    ).rejects.toThrow(/during differential update/);
  });

  it('an unknown updateType is rejected rather than silently ignored', async () => {
    await expect(
      versionRepo().createOrUpdateLocalListVersionFromStationIdAndSendLocalList(TENANT_A, STATION, {
        ocppConnectionName: STATION,
        correlationId: 'corr-1',
        versionNumber: 1,
        updateType: 'Sideways',
      }),
    ).rejects.toThrow(/Unknown SendLocalList updateType/);
  });
});

describe('DrizzleLocalListVersionRepository validateOrReplaceLocalListVersionForStation', () => {
  it('creates the version when the station has none', async () => {
    await versionRepo().validateOrReplaceLocalListVersionForStation(TENANT_A, 7, STATION);

    const version = await versionRepo().readLocalListVersionByStationId(TENANT_A, STATION);
    expect(version?.versionNumber).toBe(7);
  });

  it('leaves a matching version and its entries untouched', async () => {
    await enrol('A');
    await sendAndAccept(OCPP2_0_1.UpdateEnumType.Full, 1, [add('A')]);

    await versionRepo().validateOrReplaceLocalListVersionForStation(TENANT_A, 1, STATION);

    const version = await versionRepo().readLocalListVersionByStationId(TENANT_A, STATION);
    expect(idTokensOn(version!)).toEqual(['A']);
  });

  it('a mismatching version keeps the number the station reported and drops the entries', async () => {
    await enrol('A');
    await sendAndAccept(OCPP2_0_1.UpdateEnumType.Full, 1, [add('A')]);

    await versionRepo().validateOrReplaceLocalListVersionForStation(TENANT_A, 9, STATION);

    const version = await versionRepo().readLocalListVersionByStationId(TENANT_A, STATION);
    expect(version?.versionNumber).toBe(9);
    expect(version?.localAuthorizationList).toBeNull();
  });
});

describe('Local auth list reads', () => {
  it('getSendLocalListRequestByStationIdAndCorrelationId is scoped to station and correlation id', async () => {
    await enrol('A');
    await sendListRepo().createSendLocalListFromRequestData(
      TENANT_A,
      STATION,
      'corr-1',
      OCPP2_0_1.UpdateEnumType.Full,
      1,
      [add('A')],
    );

    const found = await sendListRepo().getSendLocalListRequestByStationIdAndCorrelationId(
      TENANT_A,
      STATION,
      'corr-1',
    );
    expect((found?.localAuthorizationList ?? []).map((a) => a.idToken)).toEqual(['A']);

    expect(
      await sendListRepo().getSendLocalListRequestByStationIdAndCorrelationId(
        TENANT_A,
        STATION,
        'corr-2',
      ),
    ).toBeUndefined();
    expect(
      await sendListRepo().getSendLocalListRequestByStationIdAndCorrelationId(
        TENANT_A,
        OTHER_STATION,
        'corr-1',
      ),
    ).toBeUndefined();
  });

  it('readLocalListVersionByStationId does not cross tenants', async () => {
    await enrol('A');
    await sendAndAccept(OCPP2_0_1.UpdateEnumType.Full, 1, [add('A')]);

    expect(await versionRepo().readLocalListVersionByStationId(TENANT_A, STATION)).toBeDefined();
    expect(await versionRepo().readLocalListVersionByStationId(TENANT_B, STATION)).toBeUndefined();
  });
});
