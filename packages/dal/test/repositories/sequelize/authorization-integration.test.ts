// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { IdTokenEnum, type SystemConfig } from '@citrineos/types';
import { Authorization, SequelizeAuthorizationRepository, Tariff } from '../../../index.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// SequelizeAuthorizationRepository resolves idTokens for every OCPP authorize path.
// idToken is a CITEXT column under a composite unique (idToken, idTokenType, tenantId),
// and every read goes through the tenant-scoped base repository.

const TENANT_A = 1;
const TENANT_B = 2;
const TOKEN = 'ABCD-1234';

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

function makeRepo(): SequelizeAuthorizationRepository {
  return new SequelizeAuthorizationRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

async function anAuthorization(overrides: Record<string, unknown> = {}) {
  return Authorization.create({
    idToken: TOKEN,
    idTokenType: IdTokenEnum.ISO14443,
    status: 'Accepted',
    tenantId: TENANT_A,
    ...overrides,
  } as any);
}

describe('SequelizeAuthorizationRepository', () => {
  describe('create and read by idToken', () => {
    it('creates an authorization and reads it back by idToken', async () => {
      const repo = makeRepo();
      const created = await repo.create(
        TENANT_A,
        Authorization.build({
          idToken: TOKEN,
          idTokenType: IdTokenEnum.ISO14443,
          status: 'Accepted',
          tenantId: TENANT_A,
        } as any),
      );

      const found = await repo.readOnlyOneByQuerystring(TENANT_A, { idToken: TOKEN });

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.idToken).toBe(TOKEN);
      expect(found!.idTokenType).toBe('ISO14443');
      expect(found!.status).toBe('Accepted');
      expect(found!.tenantId).toBe(TENANT_A);
      expect(found!.concurrentTransaction).toBe(false);
    });

    it('matches the idToken case-insensitively and preserves the stored casing', async () => {
      await anAuthorization({ idToken: 'CaseSensitive-01' });

      const found = await makeRepo().readOnlyOneByQuerystring(TENANT_A, {
        idToken: 'casesensitive-01',
      });

      expect(found).toBeDefined();
      expect(found!.idToken).toBe('CaseSensitive-01');
    });

    it('filters by token type when the querystring carries one', async () => {
      await anAuthorization({ idTokenType: IdTokenEnum.ISO14443, status: 'Accepted' });
      await anAuthorization({ idTokenType: IdTokenEnum.eMAID, status: 'Blocked' });

      const found = await makeRepo().readAllByQuerystring(TENANT_A, {
        idToken: TOKEN,
        type: IdTokenEnum.eMAID,
      });

      expect(found).toHaveLength(1);
      expect(found[0].idTokenType).toBe('eMAID');
      expect(found[0].status).toBe('Blocked');
    });

    it('filters by primary key id', async () => {
      const first = await anAuthorization({ idToken: 'TOKEN-A' });
      await anAuthorization({ idToken: 'TOKEN-B' });

      const found = await makeRepo().readAllByQuerystring(TENANT_A, { id: first.id });

      expect(found).toHaveLength(1);
      expect(found[0].idToken).toBe('TOKEN-A');
    });

    it('readOnlyOneByQuerystring throws when the idToken alone matches multiple rows', async () => {
      await anAuthorization({ idTokenType: IdTokenEnum.ISO14443 });
      await anAuthorization({ idTokenType: IdTokenEnum.eMAID });

      await expect(
        makeRepo().readOnlyOneByQuerystring(TENANT_A, { idToken: TOKEN }),
      ).rejects.toThrow(/More than one value found/);
    });
  });

  describe('group authorization', () => {
    it('surfaces the group authorization, which becomes IdTokenInfo.groupIdToken', async () => {
      const group = await anAuthorization({ idToken: 'FLEET-PARENT' });
      await anAuthorization({ idToken: 'DRIVER-CARD-1', groupAuthorizationId: group.id });

      const found = await makeRepo().readOnlyOneByQuerystring(TENANT_A, {
        idToken: 'DRIVER-CARD-1',
      });

      expect(found).toBeDefined();
      expect(found!.groupAuthorization?.idToken).toBe('FLEET-PARENT');
    });

    it('leaves groupAuthorization empty for a token that belongs to no group', async () => {
      await anAuthorization({ idToken: 'FLEET-PARENT' });

      const found = await makeRepo().readOnlyOneByQuerystring(TENANT_A, {
        idToken: 'FLEET-PARENT',
      });

      expect(found).toBeDefined();
      expect(found!.groupAuthorization ?? null).toBeNull();
    });
  });

  describe('tenant scoping', () => {
    it("does not return another tenant's token", async () => {
      await anAuthorization({ tenantId: TENANT_A });

      const all = await makeRepo().readAllByQuerystring(TENANT_B, { idToken: TOKEN });
      const one = await makeRepo().readOnlyOneByQuerystring(TENANT_B, { idToken: TOKEN });

      expect(all).toHaveLength(0);
      expect(one).toBeUndefined();
    });

    it('lets two tenants hold the same idToken and type independently', async () => {
      await anAuthorization({ tenantId: TENANT_A, status: 'Accepted' });
      await anAuthorization({ tenantId: TENANT_B, status: 'Blocked' });

      const forA = await makeRepo().readOnlyOneByQuerystring(TENANT_A, { idToken: TOKEN });
      const forB = await makeRepo().readOnlyOneByQuerystring(TENANT_B, { idToken: TOKEN });

      expect(forA!.status).toBe('Accepted');
      expect(forA!.tenantId).toBe(TENANT_A);
      expect(forB!.status).toBe('Blocked');
      expect(forB!.tenantId).toBe(TENANT_B);
      expect(await Authorization.count()).toBe(2);
    });
  });

  describe('uniqueness', () => {
    it('rejects a duplicate idToken and type within a tenant even when the casing differs', async () => {
      await anAuthorization({ idToken: 'Duplicate-Token' });

      await expect(anAuthorization({ idToken: 'duplicate-token' })).rejects.toMatchObject({
        name: 'SequelizeUniqueConstraintError',
      });
      expect(await Authorization.count()).toBe(1);
    });

    it('allows the same idToken under a different token type', async () => {
      const first = await anAuthorization({ idTokenType: IdTokenEnum.ISO14443 });
      const second = await anAuthorization({ idTokenType: IdTokenEnum.KeyCode });

      expect(second.id).not.toBe(first.id);
      expect(await Authorization.count()).toBe(2);
    });
  });

  describe('updates', () => {
    it('updateByKey changes the row and returns the updated record', async () => {
      const created = await anAuthorization({ status: 'Accepted' });

      const updated = await makeRepo().updateByKey(
        TENANT_A,
        { status: 'Blocked' } as Partial<Authorization>,
        String(created.id),
      );

      expect(updated).toBeDefined();
      expect(updated!.id).toBe(created.id);
      expect(updated!.status).toBe('Blocked');
      expect((await Authorization.findByPk(created.id))!.status).toBe('Blocked');
    });

    it('updateByKey under the wrong tenant returns undefined and leaves the row alone', async () => {
      const created = await anAuthorization({ status: 'Accepted' });

      const updated = await makeRepo().updateByKey(
        TENANT_B,
        { status: 'Blocked' } as Partial<Authorization>,
        String(created.id),
      );

      expect(updated).toBeUndefined();
      expect((await Authorization.findByPk(created.id))!.status).toBe('Accepted');
    });
  });

  describe('findAllAuthorizationsWithTariffs', () => {
    it('returns only tariff-linked authorizations with the tariff populated', async () => {
      const tariff = await Tariff.create({
        currency: 'GBP',
        pricePerKwh: 0.45,
        tariffId: 'driver-tariff-1',
        tenantId: TENANT_A,
      } as any);
      await anAuthorization({ idToken: 'NO-TARIFF' });
      await anAuthorization({ idToken: 'WITH-TARIFF', tariffId: tariff.id });

      const found = await makeRepo().findAllAuthorizationsWithTariffs(TENANT_A);

      expect(found).toHaveLength(1);
      expect(found[0].idToken).toBe('WITH-TARIFF');
      expect(found[0].tariff?.tariffId).toBe('driver-tariff-1');
    });

    it("does not leak another tenant's tariff-linked authorization", async () => {
      const tariff = await Tariff.create({
        currency: 'USD',
        pricePerKwh: 1,
        tariffId: 'tariff-a',
        tenantId: TENANT_A,
      } as any);
      await anAuthorization({ idToken: 'WITH-TARIFF', tariffId: tariff.id, tenantId: TENANT_A });

      const found = await makeRepo().findAllAuthorizationsWithTariffs(TENANT_B);

      expect(found).toHaveLength(0);
    });
  });
});
