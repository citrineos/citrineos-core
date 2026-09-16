// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  AuthorizationStatusEnum,
  IdTokenEnum,
  OCPP1_6,
  OCPP2_0_1,
  type SystemConfig,
} from '@citrineos/types';
import {
  Authorization,
  LocalListAuthorization,
  LocalListVersion,
  SendLocalList,
  SequelizeLocalAuthListRepository,
} from '../../../index.js';
import {
  LocalListVersionAuthorization,
  SendLocalListAuthorization,
} from '@dal/models/authorization/index.js';
import { aAuthorization } from '../../providers/authorization.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// SequelizeLocalAuthListRepository persists SendLocalList requests as immutable
// LocalListAuthorization snapshots and mirrors each station's accepted list in
// LocalListVersion. Tenant-predicate coverage for the 2.0.1 create path lives in
// local-auth-list-tenant-scoping-integration.test.ts; this suite covers request
// storage, 1.6 mapping, version replace/differential semantics and lookups.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'CS-LAL-01';

let h: PgHarness;

beforeAll(async () => {
  h = await startPgHarness();
}, 90_000);

afterAll(async () => {
  await h.stop();
});

beforeEach(async () => {
  await resetDb(h);
});

function makeRepo(): SequelizeLocalAuthListRepository {
  return new SequelizeLocalAuthListRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

async function anAuthorization(overrides: Record<string, unknown> = {}) {
  // The faker factory's random groupAuthorizationId would violate the FK, so it is cleared.
  const base = aAuthorization((a) => {
    (a as any).groupAuthorizationId = null;
  });
  return Authorization.create({
    ...(base as any),
    tenantId: TENANT_A,
    idToken: 'TOKEN-A',
    idTokenType: IdTokenEnum.ISO14443,
    status: AuthorizationStatusEnum.Accepted,
    ...overrides,
  } as any);
}

function authData(idToken: string, idTokenInfo?: object): OCPP2_0_1.AuthorizationData {
  return {
    idToken: { idToken, type: OCPP2_0_1.IdTokenEnumType.ISO14443 },
    ...(idTokenInfo ? { idTokenInfo } : {}),
  } as unknown as OCPP2_0_1.AuthorizationData;
}

async function seedVersion(tenantId: number, versionNumber: number, station = STATION) {
  const version = await LocalListVersion.create({
    tenantId,
    ocppConnectionName: station,
    versionNumber,
  } as any);
  const entry = await LocalListAuthorization.create({
    tenantId,
    idToken: `SEED-${tenantId}-${versionNumber}`,
    idTokenType: null,
    status: AuthorizationStatusEnum.Accepted,
  } as any);
  await LocalListVersionAuthorization.create({
    tenantId,
    localListVersionId: version.id,
    authorizationId: entry.id,
  } as any);
  return { version, entry };
}

describe('SequelizeLocalAuthListRepository', () => {
  describe('createSendLocalListFromRequestData', () => {
    it('stores the request row and a snapshot entry linked through the junction table', async () => {
      const auth = await anAuthorization();

      const sll = await makeRepo().createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-1',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        [authData('TOKEN-A')],
      );

      expect(sll.tenantId).toBe(TENANT_A);
      expect(sll.ocppConnectionName).toBe(STATION);
      expect(sll.correlationId).toBe('corr-1');
      expect(sll.versionNumber).toBe(1);
      expect(sll.updateType).toBe('Full');

      expect(sll.localAuthorizationList).toHaveLength(1);
      const [entry] = sll.localAuthorizationList!;
      expect(Number(entry.authorizationId)).toBe(auth.id);
      expect(entry.idToken).toBe('TOKEN-A');
      expect(entry.idTokenType).toBe('ISO14443');
      expect(entry.status).toBe(AuthorizationStatusEnum.Accepted);
      expect(entry.chargingPriority).toBe(auth.chargingPriority);
      expect(entry.language1).toBe(auth.language1);

      const junctions = await SendLocalListAuthorization.findAll({
        where: { sendLocalListId: sll.id },
      });
      expect(junctions).toHaveLength(1);
      expect(Number(junctions[0].authorizationId)).toBe(entry.id);
    });

    it('links groupAuthorizationId when the groupIdToken matches the stored group', async () => {
      const group = await Authorization.create({
        tenantId: TENANT_A,
        idToken: 'GROUP-1',
        idTokenType: IdTokenEnum.Central,
        status: AuthorizationStatusEnum.Accepted,
      } as any);
      await anAuthorization({ groupAuthorizationId: group.id });

      const sll = await makeRepo().createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-2',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        [
          authData('TOKEN-A', {
            status: AuthorizationStatusEnum.Accepted,
            groupIdToken: { idToken: 'GROUP-1', type: OCPP2_0_1.IdTokenEnumType.Central },
          }),
        ],
      );

      const [entry] = sll.localAuthorizationList!;
      expect(Number(entry.groupAuthorizationId)).toBe(group.id);
    });

    it('rejects a groupIdToken that does not match the stored groupAuthorizationId', async () => {
      await Authorization.create({
        tenantId: TENANT_A,
        idToken: 'GROUP-1',
        idTokenType: IdTokenEnum.Central,
        status: AuthorizationStatusEnum.Accepted,
      } as any);
      // No groupAuthorizationId on the authorization itself.
      await anAuthorization();

      await expect(
        makeRepo().createSendLocalListFromRequestData(
          TENANT_A,
          STATION,
          'corr-3',
          OCPP2_0_1.UpdateEnumType.Full,
          1,
          [
            authData('TOKEN-A', {
              status: AuthorizationStatusEnum.Accepted,
              groupIdToken: { idToken: 'GROUP-1', type: OCPP2_0_1.IdTokenEnumType.Central },
            }),
          ],
        ),
      ).rejects.toThrow(/does not match groupAuthorizationId/);

      // The failed request leaves no snapshot rows behind.
      expect(await LocalListAuthorization.count()).toBe(0);
    });

    it('stores a request without entries when no list is given', async () => {
      const sll = await makeRepo().createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-4',
        OCPP2_0_1.UpdateEnumType.Full,
        9,
      );

      expect(sll.versionNumber).toBe(9);
      expect(sll.localAuthorizationList).toHaveLength(0);
      expect(await LocalListAuthorization.count()).toBe(0);
      expect(await SendLocalListAuthorization.count()).toBe(0);
    });
  });

  describe('createSendLocalListFromRequestData16', () => {
    it('maps idTagInfo status and expiryDate onto the snapshot entry', async () => {
      const expiry = '2031-01-05T10:00:00.000Z';
      const auth = await anAuthorization({ idToken: 'TAG-1' });

      const sll = await makeRepo().createSendLocalListFromRequestData16(
        TENANT_A,
        STATION,
        'c16-1',
        OCPP1_6.SendLocalListRequestUpdateType.Full,
        3,
        [
          {
            idTag: 'TAG-1',
            idTagInfo: { status: OCPP1_6.SendLocalListRequestStatus.Blocked, expiryDate: expiry },
          },
        ],
      );

      expect(sll.updateType).toBe('Full');
      expect(sll.versionNumber).toBe(3);
      const [entry] = sll.localAuthorizationList!;
      expect(entry.idToken).toBe('TAG-1');
      expect(entry.idTokenType).toBeNull();
      expect(entry.status).toBe(AuthorizationStatusEnum.Blocked);
      expect(Number(entry.authorizationId)).toBe(auth.id);
      expect(new Date(entry.cacheExpiryDateTime as any).toISOString()).toBe(expiry);
    });

    it('defaults the status to Accepted when a Full entry has no idTagInfo', async () => {
      const auth = await anAuthorization({ idToken: 'TAG-1' });

      const sll = await makeRepo().createSendLocalListFromRequestData16(
        TENANT_A,
        STATION,
        'c16-2',
        OCPP1_6.SendLocalListRequestUpdateType.Full,
        1,
        [{ idTag: 'TAG-1' }],
      );

      const [entry] = sll.localAuthorizationList!;
      expect(entry.status).toBe(AuthorizationStatusEnum.Accepted);
      expect(Number(entry.authorizationId)).toBe(auth.id);
    });

    it('resolves parentIdTag to the parent authorization id', async () => {
      const parent = await anAuthorization({ idToken: 'PARENT-1' });
      await anAuthorization({ idToken: 'TAG-1' });

      const sll = await makeRepo().createSendLocalListFromRequestData16(
        TENANT_A,
        STATION,
        'c16-3',
        OCPP1_6.SendLocalListRequestUpdateType.Full,
        1,
        [
          {
            idTag: 'TAG-1',
            idTagInfo: {
              status: OCPP1_6.SendLocalListRequestStatus.Accepted,
              parentIdTag: 'PARENT-1',
            },
          },
        ],
      );

      const [entry] = sll.localAuthorizationList!;
      expect(Number(entry.groupAuthorizationId)).toBe(parent.id);
    });

    it('rejects an unknown parentIdTag', async () => {
      await anAuthorization({ idToken: 'TAG-1' });

      await expect(
        makeRepo().createSendLocalListFromRequestData16(
          TENANT_A,
          STATION,
          'c16-4',
          OCPP1_6.SendLocalListRequestUpdateType.Full,
          1,
          [
            {
              idTag: 'TAG-1',
              idTagInfo: {
                status: OCPP1_6.SendLocalListRequestStatus.Accepted,
                parentIdTag: 'MISSING-PARENT',
              },
            },
          ],
        ),
      ).rejects.toThrow(/Parent authorization not found/);
    });

    it('rejects a Full entry whose idTag has no authorization', async () => {
      await expect(
        makeRepo().createSendLocalListFromRequestData16(
          TENANT_A,
          STATION,
          'c16-5',
          OCPP1_6.SendLocalListRequestUpdateType.Full,
          1,
          [
            {
              idTag: 'GHOST-1',
              idTagInfo: { status: OCPP1_6.SendLocalListRequestStatus.Accepted },
            },
          ],
        ),
      ).rejects.toThrow(/Authorization not found for idTag/);
    });

    it('records a differential entry without idTagInfo as an Invalid tombstone', async () => {
      const sll = await makeRepo().createSendLocalListFromRequestData16(
        TENANT_A,
        STATION,
        'c16-6',
        OCPP1_6.SendLocalListRequestUpdateType.Differential,
        2,
        [{ idTag: 'GONE-1' }],
      );

      expect(sll.updateType).toBe('Differential');
      const [entry] = sll.localAuthorizationList!;
      expect(entry.idToken).toBe('GONE-1');
      expect(entry.status).toBe('Invalid');
      expect(entry.authorizationId).toBeNull();
    });

    it('skips entries with a null idTag', async () => {
      const sll = await makeRepo().createSendLocalListFromRequestData16(
        TENANT_A,
        STATION,
        'c16-7',
        OCPP1_6.SendLocalListRequestUpdateType.Full,
        1,
        [{ idTag: null }],
      );

      expect(sll.localAuthorizationList).toHaveLength(0);
      expect(await LocalListAuthorization.count()).toBe(0);
    });
  });

  describe('validateOrReplaceLocalListVersionForStation', () => {
    it('creates the version row when the station has none and emits created', async () => {
      const repo = makeRepo();
      const events: LocalListVersion[][] = [];
      repo.on('created', (rows) => events.push(rows as LocalListVersion[]));

      await repo.validateOrReplaceLocalListVersionForStation(TENANT_A, 4, STATION);

      const row = await LocalListVersion.findOne({
        where: { tenantId: TENANT_A, ocppConnectionName: STATION },
      });
      expect(row).not.toBeNull();
      expect(row!.versionNumber).toBe(4);
      expect(events).toHaveLength(1);
      expect(events[0][0].id).toBe(row!.id);
    });

    it('keeps the row and its entries when the reported version already matches', async () => {
      const { version } = await seedVersion(TENANT_A, 5);

      await makeRepo().validateOrReplaceLocalListVersionForStation(TENANT_A, 5, STATION);

      const row = await LocalListVersion.findOne({
        where: { tenantId: TENANT_A, ocppConnectionName: STATION },
      });
      expect(row!.id).toBe(version.id);
      expect(row!.versionNumber).toBe(5);
      expect(
        await LocalListVersionAuthorization.count({ where: { localListVersionId: version.id } }),
      ).toBe(1);
    });

    it('drops the entries and stores the reported number on version mismatch', async () => {
      const { version } = await seedVersion(TENANT_A, 5);

      await makeRepo().validateOrReplaceLocalListVersionForStation(TENANT_A, 8, STATION);

      const row = await LocalListVersion.findOne({
        where: { tenantId: TENANT_A, ocppConnectionName: STATION },
      });
      expect(row!.id).toBe(version.id);
      expect(row!.versionNumber).toBe(8);
      expect(
        await LocalListVersionAuthorization.count({ where: { localListVersionId: version.id } }),
      ).toBe(0);
    });

    it("leaves another tenant's version for the same station untouched", async () => {
      const { version: versionB } = await seedVersion(TENANT_B, 5);

      await makeRepo().validateOrReplaceLocalListVersionForStation(TENANT_A, 3, STATION);

      const rows = await LocalListVersion.findAll({ where: { ocppConnectionName: STATION } });
      expect(rows).toHaveLength(2);
      const rowA = rows.find((r) => r.tenantId === TENANT_A)!;
      const rowB = rows.find((r) => r.tenantId === TENANT_B)!;
      expect(rowA.versionNumber).toBe(3);
      expect(rowB.id).toBe(versionB.id);
      expect(rowB.versionNumber).toBe(5);
      expect(
        await LocalListVersionAuthorization.count({ where: { localListVersionId: versionB.id } }),
      ).toBe(1);
    });
  });

  describe('getSendLocalListRequestByStationIdAndCorrelationId', () => {
    it('returns the request with its entries loaded', async () => {
      await anAuthorization();
      const sll = await makeRepo().createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-get',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        [authData('TOKEN-A')],
      );

      const found = await makeRepo().getSendLocalListRequestByStationIdAndCorrelationId(
        TENANT_A,
        STATION,
        'corr-get',
      );

      expect(found).toBeDefined();
      expect(found!.id).toBe(sll.id);
      expect(found!.localAuthorizationList).toHaveLength(1);
      expect(found!.localAuthorizationList![0].idToken).toBe('TOKEN-A');
    });

    it('returns undefined for an unknown correlationId', async () => {
      await anAuthorization();
      await makeRepo().createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-get',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        [authData('TOKEN-A')],
      );

      const found = await makeRepo().getSendLocalListRequestByStationIdAndCorrelationId(
        TENANT_A,
        STATION,
        'corr-other',
      );

      expect(found).toBeUndefined();
    });

    it("does not return another tenant's request", async () => {
      await anAuthorization();
      await makeRepo().createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-get',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        [authData('TOKEN-A')],
      );

      const found = await makeRepo().getSendLocalListRequestByStationIdAndCorrelationId(
        TENANT_B,
        STATION,
        'corr-get',
      );

      expect(found).toBeUndefined();
    });
  });

  describe('createOrUpdateLocalListVersionFromStationIdAndSendLocalList', () => {
    it('creates a version with the Full request entries', async () => {
      await anAuthorization();
      const repo = makeRepo();
      const sll = await repo.createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-f1',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        [authData('TOKEN-A')],
      );

      const version = await repo.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
        TENANT_A,
        STATION,
        sll,
      );

      expect(version.tenantId).toBe(TENANT_A);
      expect(version.ocppConnectionName).toBe(STATION);
      expect(version.versionNumber).toBe(1);
      expect(version.localAuthorizationList).toHaveLength(1);
      expect(version.localAuthorizationList![0].idToken).toBe('TOKEN-A');
      expect(
        await LocalListVersionAuthorization.count({ where: { localListVersionId: version.id } }),
      ).toBe(1);
    });

    it('Full update replaces the previous version row and its entries', async () => {
      await anAuthorization({ idToken: 'TOKEN-A' });
      await anAuthorization({ idToken: 'TOKEN-B' });
      const repo = makeRepo();

      const sll1 = await repo.createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-f2',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        [authData('TOKEN-A')],
      );
      const oldVersion = await repo.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
        TENANT_A,
        STATION,
        sll1,
      );

      const sll2 = await repo.createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-f3',
        OCPP2_0_1.UpdateEnumType.Full,
        5,
        [authData('TOKEN-B')],
      );
      const newVersion = await repo.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
        TENANT_A,
        STATION,
        sll2,
      );

      expect(newVersion.id).not.toBe(oldVersion.id);
      expect(newVersion.versionNumber).toBe(5);
      expect(newVersion.localAuthorizationList).toHaveLength(1);
      expect(newVersion.localAuthorizationList![0].idToken).toBe('TOKEN-B');
      expect(await LocalListVersion.count({ where: { ocppConnectionName: STATION } })).toBe(1);
      expect(
        await LocalListVersionAuthorization.count({
          where: { localListVersionId: oldVersion.id },
        }),
      ).toBe(0);
    });

    it('Differential update re-links matching entries, adds new ones and bumps the number', async () => {
      await anAuthorization({ idToken: 'TOKEN-A' });
      await anAuthorization({ idToken: 'TOKEN-B' });
      const repo = makeRepo();

      const sllFull = await repo.createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-d1',
        OCPP2_0_1.UpdateEnumType.Full,
        1,
        [authData('TOKEN-A')],
      );
      const v1 = await repo.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
        TENANT_A,
        STATION,
        sllFull,
      );

      const sllDiff = await repo.createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-d2',
        OCPP2_0_1.UpdateEnumType.Differential,
        2,
        [authData('TOKEN-A'), authData('TOKEN-B')],
      );
      const v2 = await repo.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
        TENANT_A,
        STATION,
        sllDiff,
      );

      expect(v2.id).toBe(v1.id);
      expect(v2.versionNumber).toBe(2);
      expect(v2.localAuthorizationList).toHaveLength(2);

      // Junction rows now point at the differential request's snapshots, not the Full ones.
      const junctions = await LocalListVersionAuthorization.findAll({
        where: { localListVersionId: v2.id },
      });
      const expected = (sllDiff.localAuthorizationList as unknown as LocalListAuthorization[])
        .map((a) => a.id)
        .sort((x, y) => x - y);
      expect(junctions.map((j) => Number(j.authorizationId)).sort((x, y) => x - y)).toEqual(
        expected,
      );
    });

    it('Differential tombstone removes the matching idToken from the version', async () => {
      // Tombstone detection keys on a missing authorizationId, so the version entry
      // being deleted must be a snapshot without a linked Authorization row.
      const { version: seeded, entry } = await seedVersion(TENANT_A, 1);
      const repo = makeRepo();

      const sllDiff = await repo.createSendLocalListFromRequestData16(
        TENANT_A,
        STATION,
        'corr-t2',
        OCPP1_6.SendLocalListRequestUpdateType.Differential,
        2,
        [{ idTag: entry.idToken }],
      );
      const version = await repo.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
        TENANT_A,
        STATION,
        sllDiff,
      );

      expect(version.id).toBe(seeded.id);
      expect(version.versionNumber).toBe(2);
      expect(
        await LocalListVersionAuthorization.count({ where: { localListVersionId: version.id } }),
      ).toBe(0);
    });

    it('Differential without a list bumps the version only and keeps the entries', async () => {
      const { version } = await seedVersion(TENANT_A, 1);
      // A freshly created row has no localAuthorizationList loaded, which is the D01.FR.05 shape.
      const sll = await SendLocalList.create({
        tenantId: TENANT_A,
        ocppConnectionName: STATION,
        correlationId: 'corr-d5',
        versionNumber: 7,
        updateType: OCPP2_0_1.UpdateEnumType.Differential,
      } as any);

      const updated = await makeRepo().createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
        TENANT_A,
        STATION,
        sll,
      );

      expect(updated.id).toBe(version.id);
      expect(updated.versionNumber).toBe(7);
      expect(
        await LocalListVersionAuthorization.count({ where: { localListVersionId: version.id } }),
      ).toBe(1);
    });

    it('Differential without a list rejects when the station has no version', async () => {
      const sll = await SendLocalList.create({
        tenantId: TENANT_A,
        ocppConnectionName: STATION,
        correlationId: 'corr-d6',
        versionNumber: 7,
        updateType: OCPP2_0_1.UpdateEnumType.Differential,
      } as any);

      await expect(
        makeRepo().createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
          TENANT_A,
          STATION,
          sll,
        ),
      ).rejects.toThrow(/during differential version update/);
    });

    it('Differential with entries rejects when the station has no version', async () => {
      await anAuthorization();
      const repo = makeRepo();
      const sll = await repo.createSendLocalListFromRequestData(
        TENANT_A,
        STATION,
        'corr-d7',
        OCPP2_0_1.UpdateEnumType.Differential,
        2,
        [authData('TOKEN-A')],
      );

      await expect(
        repo.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(TENANT_A, STATION, sll),
      ).rejects.toThrow(/during differential update/);
    });
  });
});
