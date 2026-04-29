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

    const result = await repo.readAllByQuery(1, { where: { idTokenType: 'ISO14443' } });
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

  it('Base Junction with Authorization and AuthorizationTenant existByQuery', async () => {
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

    const result = await repo.existByQuery(1, { where: { idTokenType: 'ISO14443' } });
    expect(result).toBe(1);
  });

  it('Base Junction with Authorization and AuthorizationTenant findAndCount', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });
    await Authorization.create({
      idToken: 'DEADBEEB',
      idTokenType: 'ISO14443',
    });
    await AuthorizationTenant.create({
      authorizationId: auth.id,
      tenantId: 1,
    });

    const result = await repo.findAndCount(1, { where: { idTokenType: 'ISO14443' } });
    expect(result.count).toBe(2);
    expect(result.rows[0].idToken).toBe('DEADBEEF');
  });

  it('Base Junction with Authorization and AuthorizationTenant _create', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });
    await repo.create(1, auth);
    const resultTenant1 = await repo.readByKey(1, auth.id);
    const resultTenant2 = await repo.readByKey(2, auth.id);
    expect(resultTenant1).toBeDefined();
    expect(resultTenant2).toBeUndefined();
    expect(resultTenant1?.idToken).toBe('DEADBEEF');

    const secodauth = Authorization.build({ idToken: 'DEADBEEB', idTokenType: 'ISO14443' });
    await repo.create(2, secodauth);
    const resultTenant3 = await repo.readByKey(2, secodauth.id);
    expect(resultTenant3).toBeDefined();
    expect(resultTenant3?.idToken).toBe('DEADBEEB');
  });

  it('Base Junction with Authorization and AuthorizationTenant _bulkCreate', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    const auth1 = await Authorization.create({ idToken: 'DEADBEEF', idTokenType: 'ISO14443' });
    const auth2 = await Authorization.create({ idToken: 'DEADBEEB', idTokenType: 'ISO14443' });

    await repo.bulkCreate(1, [auth1, auth2], Authorization.MODEL_NAME);

    const result1 = await repo.readByKey(1, auth1.id);
    const result2 = await repo.readByKey(1, auth2.id);
    expect(result1).toBeUndefined();
    expect(result2).toBeUndefined();

    const raw1 = await Authorization.findByPk(auth1.id);
    expect(raw1).toBeDefined();
  });

  it('Base Junction with Authorization and AuthorizationTenant _createByKey', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);

    const auth = Authorization.build({ idToken: 'DEADBEEF', idTokenType: 'ISO14443' });

    const result = await repo.createByKey(1, auth, '42');

    expect(result).toBeDefined();
    expect(result.idToken).toBe('DEADBEEF');

    const raw = await Authorization.findByPk(42);
    expect(raw).toBeDefined();
    expect(raw?.idToken).toBe('DEADBEEF');
  });

  it('Base Junction with Authorization and AuthorizationTenant _readOrCreateByQuery', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);

    const [result, created] = await repo.readOrCreateByQuery(1, {
      where: { idToken: 'DEADBEEF', idTokenType: 'ISO14443' },
      defaults: { idToken: 'DEADBEEF', idTokenType: 'ISO14443' },
    });

    expect(result).toBeDefined();
    expect(result.idToken).toBe('DEADBEEF');
    expect(created).toBe(true);

    const [result2, created2] = await repo.readOrCreateByQuery(1, {
      where: { idToken: 'DEADBEEF', idTokenType: 'ISO14443' },
      defaults: { idToken: 'DEADBEEF', idTokenType: 'ISO14443' },
    });
    expect(result2.id).toBe(result.id);
    expect(created2).toBe(false);
  });

  it('Base Junction with Authorization and AuthorizationTenant _updateByKey', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    const auth = await Authorization.create({ idToken: 'DEADBEEF', idTokenType: 'ISO14443' });
    await AuthorizationTenant.create({ authorizationId: auth.id, tenantId: 1 });
    const updated = await repo.updateByKey(1, { idToken: 'UPDATED' }, String(auth.id));
    expect(updated).toBeDefined();
    expect(updated?.idToken).toBe('UPDATED');

    const notFound = await repo.updateByKey(2, { idToken: 'UPDATED' }, String(auth.id));
    expect(notFound).toBeUndefined();
  });

  it('Base Junction with Authorization and AuthorizationTenant _updateAllByQuery', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    const auth = await Authorization.create({ idToken: 'DEADBEEF', idTokenType: 'ISO14443' });
    await AuthorizationTenant.create({ authorizationId: auth.id, tenantId: 1 });

    const results = await repo.updateAllByQuery(1, { idToken: 'UPDATED' } as any, {
      where: { idToken: 'DEADBEEF' },
    });

    expect(results).toHaveLength(1);
    expect(results[0].idToken).toBe('UPDATED');

    const found = await repo.readByKey(1, auth.id);
    expect(found).toBeDefined();
    expect(found?.idToken).toBe('UPDATED');
  });

  it('Base Junction with Authorization and AuthorizationTenant _deleteByKey', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });
    await repo.deleteByKey(1, auth.id);
    const resultTenant1 = await repo.readByKey(1, auth.id);
    expect(resultTenant1).toBeUndefined();
  });

  it('Base Junction with Authorization and AuthorizationTenant _deleteAllByQuery', async () => {
    await Tenant.create({ id: 1, name: 'tenant-1', isUserTenant: false } as any);
    await Tenant.create({ id: 2, name: 'tenant-2', isUserTenant: false } as any);
    const auth = await Authorization.create({
      idToken: 'DEADBEEF',
      idTokenType: 'ISO14443',
    });
    await AuthorizationTenant.create({ authorizationId: auth.id, tenantId: 1 });

    const deleted = await repo.deleteAllByQuery(1, {
      where: { idTokenType: 'ISO14443' },
    });

    expect(deleted).toHaveLength(1);
    expect(deleted[0].idToken).toBe('DEADBEEF');

    const resultTenant1 = await repo.readByKey(1, auth.id);
    expect(resultTenant1).toBeUndefined();
  });
});
