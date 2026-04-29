// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { setupTestDatabase } from './setupTestDatabase.js';
import { SequelizeAuthorizationRepository } from '../../../../src/layers/sequelize/repository/Authorization.js';
import {
  Authorization,
  AuthorizationTenant,
  Tenant,
} from '../../../../src/layers/sequelize/index.js';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';

describe('SequelizeAuthorizationRepository - integration', () => {
  const db = setupTestDatabase();
  let repo: SequelizeAuthorizationRepository;

  beforeAll(() => {
    repo = new SequelizeAuthorizationRepository({} as any, undefined, db.sequelize);
  });

  beforeEach(async () => {
    await db.cleanup();
  });

  it('Base Junction with Authorization and AuthorizationTenant readByKey', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });
    await AuthorizationTenant.create({
      authorizationId: auth.id,
      tenantId: 1,
    });

    const result = await repo.readByKey(1, auth.id);
    expect(result).toBeDefined();
    expect(result?.idToken).toBe('DEADBEEF');
  });

  it('Base Junction with Authorization and AuthorizationTenant readAllByQuery', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });

    const auth2 = await Authorization.create({
      idToken: 'DEADBEEB',
      idTokenType: 'ISO14443',
    });
    await AuthorizationTenant.create({
      authorizationId: auth.id,
      tenantId: 1,
    });
    await AuthorizationTenant.create({
      authorizationId: auth2.id,
      tenantId: 1,
    });

    const result = await repo.readAllByQuery(1, { idToken: 'DEADBEEF' });
    expect(result).toHaveLength(2);
    expect(result[0].idToken).toBe('DEADBEEF');
    expect(result[1].idToken).toBe('DEADBEEB');
  });

  it('Base Junction with Authorization and AuthorizationTenant readAllByQuerystring', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });
    await AuthorizationTenant.create({
      authorizationId: auth.id,
      tenantId: 1,
    });

    const result = await repo.readAllByQuerystring(1, { idToken: 'DEADBEEF' });
    expect(result).toHaveLength(1);
    expect(result[0].idToken).toBe('DEADBEEF');
  });

  it('Base Junction with Authorization and AuthorizationTenant readNextValue', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });
    const auth2 = await Authorization.create({
      idToken: 'DEADBEEB',
      idTokenType: 'ISO14443',
    });

    await AuthorizationTenant.create({
      authorizationId: auth.id,
      tenantId: 1,
    });

    const result = await repo.readNextValue(1, 'id');
    expect(result).toBeDefined();
    expect(result).toBe(auth2.id + 1);
  });

  it('Base Junction with Authorization and AuthorizationTenant existsByKey', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });
    await AuthorizationTenant.create({
      authorizationId: auth.id,
      tenantId: 1,
    });

    const result = await repo.existsByKey(1, auth.id);
    const unexistingResult = await repo.existsByKey(1, auth.id + 1);
    expect(result).toBe(true);
    expect(unexistingResult).toBe(false);
  });

  it('inserts and reads back an authorization', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    // Create a real Authorization row
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });

    // Create the junction row (tenant 1 owns this auth)
    await AuthorizationTenant.create({
      authorizationId: auth.id,
      tenantId: 1,
    });

    // Now read it back through the repo
    const result = await repo.readAllByQuerystring(1, { idToken: 'DEADBEEF' });

    expect(result).toHaveLength(1);
    expect(result[0].idToken).toBe('DEADBEEF');
  });

  it('tenant isolation - tenant 2 cannot see tenant 1 data', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });

    // Only tenant 1 owns this
    await AuthorizationTenant.create({
      authorizationId: auth.id,
      tenantId: 1,
    });

    // Tenant 2 queries - should get nothing
    const result = await repo.readAllByQuerystring(2, { idToken: 'DEADBEEF' });

    expect(result).toHaveLength(0);
  });

  it('readByKey returns undefined if tenant does not own the record', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });

    await AuthorizationTenant.create({
      authorizationId: auth.id,
      tenantId: 1,
    });

    const result = await repo.readByKey(99, auth.id);

    expect(result).toBeUndefined();
  });

  it('deletes authorization and its junction row', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'TODELETE',
      idTokenType: 'ISO14443',
    });
    await AuthorizationTenant.create({
      authorizationId: auth.id,
      tenantId: 1,
    });

    await repo.deleteByKey(1, String(auth.id));

    // Both rows should be gone
    const authRow = await Authorization.findByPk(auth.id);
    const junctionRow = await AuthorizationTenant.findOne({
      where: { authorizationId: auth.id },
    });

    expect(authRow).toBeNull();
    expect(junctionRow).toBeNull();
  });

  it('Authorize transaction - readOnlyOneByQuerystring', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const authCreated = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });
    await repo.create(1, authCreated);
    const result = await repo.readOnlyOneByQuerystring(1, { idToken: 'DEADBEEF' });
    expect(result).toBeDefined();
    expect(result?.idToken).toBe('DEADBEEF');
    const result2 = await repo.readOnlyOneByQuerystring(1, { idToken: 'DEADBEEB' });
    expect(result2).toBeUndefined();
    const result3 = await repo.readOnlyOneByQuerystring(2, {
      idToken: 'DEADBEEF',
      type: 'ISO14443',
    });
    expect(result3).toBeUndefined();
    const result4 = await repo.readOnlyOneByQuerystring(1, {
      idToken: 'DEADBEEF',
      type: 'ISO14443',
    });
    expect(result4).toBeDefined();
  });
});
