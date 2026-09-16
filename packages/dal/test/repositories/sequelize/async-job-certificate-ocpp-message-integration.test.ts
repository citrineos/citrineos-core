// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MessageOrigin, type OCPPMessageDto, OCPPVersion } from '@citrineos/types';
import {
  AsyncJobStatus,
  Certificate,
  ChargingStation,
  OCPPMessage,
  SequelizeAsyncJobStatusRepository,
  SequelizeCertificateRepository,
  SequelizeOCPPMessageRepository,
  TenantPartner,
} from '../../../index.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// Three small repositories sharing one container: async job status rows keyed by a uuid
// jobId, certificates under a (tenantId, serialNumber, issuerName) unique index, and OCPP
// messages whose stationId resolves from ocppConnectionName on insert.
//
// SequelizeAsyncJobStatusRepository.updateAsyncJobStatus, findAllByQuery and deleteByJobId
// hard-code tenantId 0 in their where clauses and never match rows stored under a real
// tenant; those paths stay untested here.

const TENANT_A = 1;
const TENANT_B = 2;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

function deps() {
  return { config: h.config, sequelizeInstance: h.sequelizeInstance };
}

describe('SequelizeAsyncJobStatusRepository', () => {
  function makeRepo() {
    return new SequelizeAsyncJobStatusRepository(deps());
  }

  // tenantPartnerId is NOT NULL, so every job row needs a partner under its own tenant.
  async function aPartner(tenantId: number) {
    return TenantPartner.create({
      partyId: `P${tenantId}`,
      countryCode: 'US',
      tenantId,
    } as any);
  }

  it('createAsyncJobStatus persists the job under the tenant carried by the instance', async () => {
    const partner = await aPartner(TENANT_B);

    const created = await makeRepo().createAsyncJobStatus(
      AsyncJobStatus.build({
        jobName: 'FETCH_OCPI_TOKENS',
        tenantPartnerId: partner.id,
        tenantId: TENANT_B,
        paginationParams: { offset: 0, limit: 25 },
      } as any),
    );

    expect(created.jobId).toMatch(UUID);
    expect(created.jobName).toBe('FETCH_OCPI_TOKENS');
    expect(created.tenantId).toBe(TENANT_B);
    expect(created.tenantPartnerId).toBe(partner.id);
    expect(created.stopScheduled).toBe(false);
    expect(created.isFailed).toBe(false);
    expect(await AsyncJobStatus.count()).toBe(1);
  });

  it('readByJobId returns the row with its JSON pagination params', async () => {
    const partner = await aPartner(TENANT_A);
    const stored = await AsyncJobStatus.create({
      jobName: 'FETCH_OCPI_TOKENS',
      tenantPartnerId: partner.id,
      tenantId: TENANT_A,
      paginationParams: { offset: 100, limit: 50 },
      totalObjects: 400,
    } as any);

    const found = await makeRepo().readByJobId(stored.jobId);

    expect(found).toBeDefined();
    expect(found!.jobId).toBe(stored.jobId);
    expect(found!.paginationParams).toEqual({ offset: 100, limit: 50 });
    expect(found!.totalObjects).toBe(400);
    expect(found!.stoppedAt ?? null).toBeNull();
  });

  it('readByJobId returns undefined for an unknown jobId', async () => {
    const partner = await aPartner(TENANT_A);
    await AsyncJobStatus.create({
      jobName: 'FETCH_OCPI_TOKENS',
      tenantPartnerId: partner.id,
      tenantId: TENANT_A,
      paginationParams: {},
    } as any);

    expect(await makeRepo().readByJobId('11111111-2222-3333-4444-555555555555')).toBeUndefined();
  });

  it('updateAsyncJobStatus rejects when no row matches the jobId', async () => {
    await expect(
      makeRepo().updateAsyncJobStatus({ jobId: 'no-such-job', totalObjects: 5 }),
    ).rejects.toThrow('Failed to update AsyncJobStatus with id no-such-job');
  });
});

describe('SequelizeCertificateRepository', () => {
  function makeRepo() {
    return new SequelizeCertificateRepository(deps());
  }

  function aCertInput(overrides: Record<string, unknown> = {}) {
    return {
      serialNumber: 987654321,
      issuerName: 'Test Root CA',
      organizationName: 'CitrineOS',
      commonName: 'citrine.test',
      ...overrides,
    } as any;
  }

  it('createCertificate saves the row under the tenant and emits created', async () => {
    const repo = makeRepo();
    const emitted: Certificate[][] = [];
    repo.on('created', (rows: Certificate[]) => emitted.push(rows));

    const saved = await repo.createCertificate(
      TENANT_A,
      aCertInput({ certificateFileHash: 'hash-a' }),
    );

    expect(saved.id).toBeGreaterThan(0);
    expect(saved.tenantId).toBe(TENANT_A);
    expect(Number(saved.serialNumber)).toBe(987654321);
    expect(saved.issuerName).toBe('Test Root CA');
    expect(saved.certificateFileHash).toBe('hash-a');
    expect(emitted).toHaveLength(1);
    expect(emitted[0][0].id).toBe(saved.id);
    expect(await Certificate.count()).toBe(1);
  });

  it('findByFileHash matches only the exact hash', async () => {
    const repo = makeRepo();
    const withHash = await repo.createCertificate(
      TENANT_A,
      aCertInput({ certificateFileHash: 'hash-a' }),
    );
    await repo.createCertificate(
      TENANT_A,
      aCertInput({ serialNumber: 222, issuerName: 'Other CA', certificateFileHash: 'hash-b' }),
    );

    const found = await repo.findByFileHash(TENANT_A, 'hash-a');

    expect(found).toBeDefined();
    expect(found!.id).toBe(withHash.id);
    expect(found!.commonName).toBe('citrine.test');
    expect(await repo.findByFileHash(TENANT_A, 'hash-c')).toBeUndefined();
  });

  it("findByFileHash does not return another tenant's certificate", async () => {
    await makeRepo().createCertificate(TENANT_A, aCertInput({ certificateFileHash: 'hash-a' }));

    expect(await makeRepo().findByFileHash(TENANT_B, 'hash-a')).toBeUndefined();
  });

  it('findById scopes to the tenant', async () => {
    const repo = makeRepo();
    const saved = await repo.createCertificate(TENANT_A, aCertInput());

    const forA = await repo.findById(TENANT_A, saved.id!);

    expect(forA).toBeDefined();
    expect(forA!.issuerName).toBe('Test Root CA');
    expect(await repo.findById(TENANT_B, saved.id!)).toBeUndefined();
  });

  it('createOrUpdateCertificate creates when serialNumber and issuerName are new', async () => {
    const created = await makeRepo().createOrUpdateCertificate(
      TENANT_A,
      aCertInput({ certificateFileHash: 'hash-new' }),
    );

    expect(created.id).toBeGreaterThan(0);
    expect(created.tenantId).toBe(TENANT_A);
    expect(created.certificateFileHash).toBe('hash-new');
    expect(await Certificate.count()).toBe(1);
  });

  it('createOrUpdateCertificate updates the existing row in place', async () => {
    const repo = makeRepo();
    const original = await repo.createCertificate(
      TENANT_A,
      aCertInput({ commonName: 'old.test', certificateFileHash: 'hash-1' }),
    );

    const updated = await repo.createOrUpdateCertificate(
      TENANT_A,
      aCertInput({ commonName: 'new.test', certificateFileHash: 'hash-2' }),
    );

    expect(updated.id).toBe(original.id);
    expect(updated.commonName).toBe('new.test');
    expect(updated.certificateFileHash).toBe('hash-2');
    expect(await Certificate.count()).toBe(1);
    expect((await Certificate.findByPk(original.id!))!.commonName).toBe('new.test');
  });

  it('rejects a duplicate serialNumber and issuerName within a tenant', async () => {
    const repo = makeRepo();
    await repo.createCertificate(TENANT_A, aCertInput());

    await expect(repo.createCertificate(TENANT_A, aCertInput())).rejects.toMatchObject({
      name: 'SequelizeUniqueConstraintError',
    });
    expect(await Certificate.count()).toBe(1);
  });

  it('lets two tenants hold the same serialNumber and issuerName', async () => {
    const repo = makeRepo();
    const forA = await repo.createCertificate(TENANT_A, aCertInput());
    const forB = await repo.createCertificate(TENANT_B, aCertInput());

    expect(forA.tenantId).toBe(TENANT_A);
    expect(forB.tenantId).toBe(TENANT_B);
    expect(forB.id).not.toBe(forA.id);
    expect(await Certificate.count()).toBe(2);
  });
});

describe('SequelizeOCPPMessageRepository', () => {
  function makeRepo() {
    return new SequelizeOCPPMessageRepository(deps());
  }

  function aMessage(overrides: Partial<OCPPMessageDto> = {}): OCPPMessageDto {
    return {
      ocppConnectionName: 'cp001',
      origin: MessageOrigin.ChargingStation,
      protocol: OCPPVersion.OCPP2_0_1,
      action: 'BootNotification',
      correlationId: 'corr-1',
      payload: { reason: 'PowerUp' },
      raw: '[2,"corr-1","BootNotification",{"reason":"PowerUp"}]',
      timestamp: '2026-01-05T10:00:00.000Z',
      tenantId: TENANT_A,
      ...overrides,
    } as OCPPMessageDto;
  }

  async function aStation(tenantId = TENANT_A, ocppConnectionName = 'cp001') {
    return ChargingStation.create({ ocppConnectionName, isOnline: true, tenantId } as any);
  }

  it('createOCPPMessage resolves stationId from the connection name within the tenant', async () => {
    const station = await aStation();

    const created = await makeRepo().createOCPPMessage(TENANT_A, aMessage());

    expect(created.stationId).toBe(station.id);
    expect(created.tenantId).toBe(TENANT_A);
    expect(created.action).toBe('BootNotification');
    expect(created.correlationId).toBe('corr-1');

    const row = (await OCPPMessage.findByPk(created.id))!;
    expect(row.timestamp).toBe('2026-01-05T10:00:00.000Z');
    expect(row.payload).toEqual({ reason: 'PowerUp' });
    expect(row.raw).toBe('[2,"corr-1","BootNotification",{"reason":"PowerUp"}]');
  });

  it("createOCPPMessage does not adopt another tenant's station", async () => {
    await aStation(TENANT_A, 'cp001');

    const created = await makeRepo().createOCPPMessage(TENANT_B, aMessage({ tenantId: TENANT_B }));

    expect(created.stationId ?? null).toBeNull();
    expect(created.tenantId).toBe(TENANT_B);
    expect(await OCPPMessage.count()).toBe(1);
  });

  it('getRequestByCorrelationId returns the request row, not its response', async () => {
    const repo = makeRepo();
    const request = await repo.createOCPPMessage(TENANT_A, aMessage({ correlationId: 'corr-9' }));
    await OCPPMessage.create({
      ocppConnectionName: 'cp001',
      origin: MessageOrigin.ChargingStationManagementSystem,
      protocol: OCPPVersion.OCPP2_0_1,
      correlationId: 'corr-9',
      raw: '[3,"corr-9",{"status":"Accepted"}]',
      timestamp: '2026-01-05T10:00:01.000Z',
      requestMessageId: request.id,
      tenantId: TENANT_A,
    } as any);

    const found = await repo.getRequestByCorrelationId(TENANT_A, 'corr-9');

    expect(await OCPPMessage.count()).toBe(2);
    expect(found).toBeDefined();
    expect(found!.id).toBe(request.id);
    expect(found!.origin).toBe('cs');
  });

  it('getRequestByCorrelationId under the wrong tenant returns undefined', async () => {
    await makeRepo().createOCPPMessage(TENANT_A, aMessage({ correlationId: 'corr-9' }));

    expect(await makeRepo().getRequestByCorrelationId(TENANT_B, 'corr-9')).toBeUndefined();
  });

  it('getRequestByCorrelationId throws when two requests share a correlationId', async () => {
    const repo = makeRepo();
    await repo.createOCPPMessage(TENANT_A, aMessage({ correlationId: 'corr-dup' }));
    await repo.createOCPPMessage(TENANT_A, aMessage({ correlationId: 'corr-dup' }));

    await expect(repo.getRequestByCorrelationId(TENANT_A, 'corr-dup')).rejects.toThrow(
      /More than one value found/,
    );
  });
});
