// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import {
  type BootCreate,
  CertificateUseEnum,
  DeleteCertificateStatusEnum,
  HashAlgorithmEnum,
  InstallCertificateStatusEnum,
} from '@citrineos/types';
import {
  Boot,
  Certificate,
  ChargingStation,
  DeleteCertificateAttempt,
  type IBootRepository,
  type ICertificateRepository,
  type IDeleteCertificateAttemptRepository,
  type IInstallCertificateAttemptRepository,
  type IInstalledCertificateRepository,
  InstalledCertificate,
  SequelizeBootRepository,
  SequelizeCertificateRepository,
  SequelizeDeleteCertificateAttemptRepository,
  SequelizeInstallCertificateAttemptRepository,
  SequelizeInstalledCertificateRepository,
} from '../../../index.js';
import { DrizzleBootRepository, toBootDto } from '@dal/repositories/drizzle/boot.js';
import {
  DrizzleCertificateRepository,
  toCertificateDto,
} from '@dal/repositories/drizzle/certificate.js';
import {
  DrizzleDeleteCertificateAttemptRepository,
  toDeleteCertificateAttemptDto,
} from '@dal/repositories/drizzle/delete-certificate-attempt.js';
import {
  DrizzleInstallCertificateAttemptRepository,
  toInstallCertificateAttemptDto,
} from '@dal/repositories/drizzle/install-certificate-attempt.js';
import {
  DrizzleInstalledCertificateRepository,
  toInstalledCertificateDto,
} from '@dal/repositories/drizzle/installed-certificate.js';
import { DrizzleVariableAttributeRepository } from '@dal/repositories/drizzle/variable-attribute.js';
import type { BootEntity } from '@dal/db/drizzle/schema/boot.js';
import type { CertificateEntity } from '@dal/db/drizzle/schema/certificate.js';
import type { DeleteCertificateAttemptEntity } from '@dal/db/drizzle/schema/delete-certificate-attempt.js';
import type { InstallCertificateAttemptEntity } from '@dal/db/drizzle/schema/install-certificate-attempt.js';
import type { InstalledCertificateEntity } from '@dal/db/drizzle/schema/installed-certificate.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// Both DAL layers serve the same repository interfaces behind CITRINEOS_USE_DRIZZLE,
// so each behavioral block below runs against the Sequelize and the Drizzle
// implementation over the same Postgres schema (created via sequelize.sync).

const TENANT = 1;
const OTHER_TENANT = 2;
const STATION = 'CS-001';

let h: PgHarness;
let drizzlePool: pg.Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  h = await startPgHarness();
  // Own pool: the DefaultDrizzleInstance singleton exposes no way to close it.
  drizzlePool = new pg.Pool({
    host: h.config.database.host,
    port: h.config.database.port,
    database: h.config.database.database,
    user: h.config.database.username,
    password: h.config.database.password,
  });
  db = drizzle(drizzlePool);
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await h?.stop();
}, 90_000);

beforeEach(async () => {
  await resetDb(h);
});

type Kind = 'sequelize' | 'drizzle';
const kinds: Kind[] = ['sequelize', 'drizzle'];

function bootRepo(kind: Kind): IBootRepository {
  if (kind === 'sequelize') {
    return new SequelizeBootRepository({
      config: h.config,
      sequelizeInstance: h.sequelizeInstance,
    });
  }
  return new DrizzleBootRepository({
    config: h.config,
    drizzleInstance: db,
    variableAttributeRepository: new DrizzleVariableAttributeRepository({
      config: h.config,
      drizzleInstance: db,
    }),
  });
}

function certificateRepo(kind: Kind): ICertificateRepository {
  return kind === 'sequelize'
    ? new SequelizeCertificateRepository({
        config: h.config,
        sequelizeInstance: h.sequelizeInstance,
      })
    : new DrizzleCertificateRepository({ config: h.config, drizzleInstance: db });
}

function installedCertificateRepo(kind: Kind): IInstalledCertificateRepository {
  return kind === 'sequelize'
    ? new SequelizeInstalledCertificateRepository({
        config: h.config,
        sequelizeInstance: h.sequelizeInstance,
      })
    : new DrizzleInstalledCertificateRepository({ config: h.config, drizzleInstance: db });
}

function installAttemptRepo(kind: Kind): IInstallCertificateAttemptRepository {
  return kind === 'sequelize'
    ? new SequelizeInstallCertificateAttemptRepository({
        config: h.config,
        sequelizeInstance: h.sequelizeInstance,
      })
    : new DrizzleInstallCertificateAttemptRepository({ config: h.config, drizzleInstance: db });
}

function deleteAttemptRepo(kind: Kind): IDeleteCertificateAttemptRepository {
  return kind === 'sequelize'
    ? new SequelizeDeleteCertificateAttemptRepository({
        config: h.config,
        sequelizeInstance: h.sequelizeInstance,
      })
    : new DrizzleDeleteCertificateAttemptRepository({ config: h.config, drizzleInstance: db });
}

async function aStation(tenantId: number, ocppConnectionName = STATION): Promise<{ id: number }> {
  const station = await ChargingStation.create({
    ocppConnectionName,
    isOnline: false,
    tenantId,
  } as any);
  return station as unknown as { id: number };
}

async function aCertificate(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const certificate = await Certificate.create({
    serialNumber: 1001,
    issuerName: 'CN=Citrine Test CA',
    organizationName: 'CitrineOS',
    commonName: 'citrineos.test',
    tenantId,
    ...overrides,
  } as any);
  return certificate as unknown as { id: number };
}

describe.each(kinds)('Boot repository (%s)', (kind) => {
  it('createOrUpdateByKey inserts a row keyed by the resolved station', async () => {
    const repo = bootRepo(kind);
    const station = await aStation(TENANT);

    const boot = await repo.createOrUpdateByKey(
      TENANT,
      { status: 'Pending', heartbeatInterval: 120 } as BootCreate,
      STATION,
    );

    expect(boot!.stationId).toBe(station.id);
    expect(boot!.status).toBe('Pending');
    expect(boot!.heartbeatInterval).toBe(120);
    expect(await Boot.count()).toBe(1);
    expect(await repo.existsByKey(TENANT, STATION)).toBe(true);
  });

  it('createOrUpdateByKey updates in place on the second call', async () => {
    const repo = bootRepo(kind);
    await aStation(TENANT);

    const first = await repo.createOrUpdateByKey(
      TENANT,
      { status: 'Pending', heartbeatInterval: 120 } as BootCreate,
      STATION,
    );
    const second = await repo.createOrUpdateByKey(
      TENANT,
      { status: 'Accepted' } as BootCreate,
      STATION,
    );

    expect(second!.id).toBe(first!.id);
    expect(second!.status).toBe('Accepted');
    expect(await Boot.count()).toBe(1);

    const read = await repo.readByKey(TENANT, STATION);
    expect(read!.status).toBe('Accepted');
    // Fields absent from the second payload keep their stored value.
    expect(read!.heartbeatInterval).toBe(120);
  });

  it('createOrUpdateByKey throws for an unknown station', async () => {
    const repo = bootRepo(kind);

    await expect(
      repo.createOrUpdateByKey(TENANT, { status: 'Pending' } as BootCreate, 'GHOST'),
    ).rejects.toThrow(
      `Cannot store boot configuration: no charging station GHOST exists for tenant ${TENANT}`,
    );
    expect(await Boot.count()).toBe(0);
  });

  it('updateByKey scopes to the calling tenant and strips stationId/tenantId', async () => {
    const repo = bootRepo(kind);
    const stationA = await aStation(TENANT);
    await aStation(OTHER_TENANT);
    await repo.createOrUpdateByKey(TENANT, { status: 'Accepted' } as BootCreate, STATION);
    await repo.createOrUpdateByKey(OTHER_TENANT, { status: 'Accepted' } as BootCreate, STATION);

    const updated = await repo.updateByKey(
      TENANT,
      {
        status: 'Rejected',
        lastBootTime: '2025-06-01T12:00:00.000Z',
        stationId: 9999,
        tenantId: 42,
      },
      STATION,
    );

    expect(updated!.status).toBe('Rejected');
    expect(updated!.stationId).toBe(stationA.id);
    expect(updated!.tenantId).toBe(TENANT);
    expect(updated!.lastBootTime).toBe('2025-06-01T12:00:00.000Z');
    expect((await repo.readByKey(OTHER_TENANT, STATION))!.status).toBe('Accepted');
  });

  it('deleteByKey removes only the calling tenant row and returns it', async () => {
    const repo = bootRepo(kind);
    const stationA = await aStation(TENANT);
    await aStation(OTHER_TENANT);
    await repo.createOrUpdateByKey(TENANT, { status: 'Pending' } as BootCreate, STATION);
    await repo.createOrUpdateByKey(OTHER_TENANT, { status: 'Pending' } as BootCreate, STATION);

    const deleted = await repo.deleteByKey(TENANT, STATION);

    expect(deleted!.stationId).toBe(stationA.id);
    expect(await Boot.count()).toBe(1);
    expect(await repo.existsByKey(TENANT, STATION)).toBe(false);
    expect(await repo.existsByKey(OTHER_TENANT, STATION)).toBe(true);
  });

  it('read/update/delete/exists return undefined or false for an unknown station', async () => {
    const repo = bootRepo(kind);

    expect(await repo.readByKey(TENANT, 'GHOST')).toBeUndefined();
    expect(await repo.updateByKey(TENANT, { status: 'Rejected' }, 'GHOST')).toBeUndefined();
    expect(await repo.deleteByKey(TENANT, 'GHOST')).toBeUndefined();
    expect(await repo.existsByKey(TENANT, 'GHOST')).toBe(false);
  });
});

describe.each(kinds)('Certificate repository (%s)', (kind) => {
  it('createCertificate persists scalar fields', async () => {
    const repo = certificateRepo(kind);

    const created = await repo.createCertificate(TENANT, {
      serialNumber: 9007,
      issuerName: 'CN=Root CA',
      organizationName: 'CitrineOS',
      commonName: 'root.citrineos.test',
      keyLength: 2048,
      certificateFileHash: 'hash-1',
      validBefore: '2030-01-01T00:00:00.000Z',
    });

    expect(created.id).toBeDefined();
    expect(created.commonName).toBe('root.citrineos.test');
    expect(await Certificate.count()).toBe(1);

    const found = await repo.findByFileHash(TENANT, 'hash-1');
    // Sequelize reads the BIGINT column back as a string; compare numerically.
    expect(Number(found!.serialNumber)).toBe(9007);
    expect(found!.issuerName).toBe('CN=Root CA');
    expect(found!.keyLength).toBe(2048);
    expect(new Date(found!.validBefore!).toISOString()).toBe('2030-01-01T00:00:00.000Z');
  });

  it('findByFileHash is tenant-scoped', async () => {
    const repo = certificateRepo(kind);
    await aCertificate(TENANT, { certificateFileHash: 'hash-t1' });

    const own = await repo.findByFileHash(TENANT, 'hash-t1');
    expect(own!.issuerName).toBe('CN=Citrine Test CA');
    expect(await repo.findByFileHash(OTHER_TENANT, 'hash-t1')).toBeUndefined();
  });

  it('createOrUpdateCertificate updates the row matching serialNumber and issuerName', async () => {
    const repo = certificateRepo(kind);
    const created = await repo.createCertificate(TENANT, {
      serialNumber: 555,
      issuerName: 'CN=Sub CA',
      organizationName: 'CitrineOS',
      commonName: 'old.citrineos.test',
    });

    const updated = await repo.createOrUpdateCertificate(TENANT, {
      serialNumber: 555,
      issuerName: 'CN=Sub CA',
      organizationName: 'CitrineOS',
      commonName: 'new.citrineos.test',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.commonName).toBe('new.citrineos.test');
    expect(await Certificate.count()).toBe(1);

    const inserted = await repo.createOrUpdateCertificate(TENANT, {
      serialNumber: 556,
      issuerName: 'CN=Sub CA',
      organizationName: 'CitrineOS',
      commonName: 'other.citrineos.test',
    });
    expect(inserted.id).not.toBe(created.id);
    expect(await Certificate.count()).toBe(2);
  });

  it('rejects a duplicate serialNumber/issuerName insert within a tenant', async () => {
    const repo = certificateRepo(kind);
    const input = {
      serialNumber: 777,
      issuerName: 'CN=Dup CA',
      organizationName: 'CitrineOS',
      commonName: 'dup.citrineos.test',
    };
    await repo.createCertificate(TENANT, input);

    // Same unique index, surfaced through each ORM's own error type: Sequelize
    // throws UniqueConstraintError, Drizzle wraps the pg error in DrizzleQueryError.
    const expected =
      kind === 'sequelize' ? /Validation error/ : /Failed query: insert into "Certificates"/;
    await expect(repo.createCertificate(TENANT, input)).rejects.toThrow(expected);
    expect(await Certificate.count()).toBe(1);
  });
});

describe.each(kinds)('InstalledCertificate repository (%s)', (kind) => {
  it('createInstalledCertificate resolves stationId from the connection name', async () => {
    const repo = installedCertificateRepo(kind);
    const station = await aStation(TENANT);

    const created = await repo.createInstalledCertificate(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.V2GRootCertificate,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      issuerNameHash: 'inh-1',
      issuerKeyHash: 'ikh-1',
      serialNumber: 'sn-1',
    });

    expect(created.certificateType).toBe('V2GRootCertificate');
    expect(created.hashAlgorithm).toBe('SHA256');
    expect(created.tenantId).toBe(TENANT);

    const row = await InstalledCertificate.findByPk(created.id!);
    expect(row!.stationId).toBe(station.id);
    expect(row!.serialNumber).toBe('sn-1');
  });

  it('findByStationAndType is tenant-scoped for same-named stations', async () => {
    const repo = installedCertificateRepo(kind);
    await aStation(TENANT);
    await aStation(OTHER_TENANT);
    await repo.createInstalledCertificate(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.CSMSRootCertificate,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      serialNumber: 'sn-a',
    });
    await repo.createInstalledCertificate(OTHER_TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.CSMSRootCertificate,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      serialNumber: 'sn-b',
    });

    const own = await repo.findByStationAndType(
      TENANT,
      STATION,
      CertificateUseEnum.CSMSRootCertificate,
    );
    const other = await repo.findByStationAndType(
      OTHER_TENANT,
      STATION,
      CertificateUseEnum.CSMSRootCertificate,
    );

    expect(own!.serialNumber).toBe('sn-a');
    expect(other!.serialNumber).toBe('sn-b');
    expect(
      await repo.findByStationAndType(TENANT, STATION, CertificateUseEnum.MORootCertificate),
    ).toBeUndefined();
  });

  it('setCertificateId links a certificate readable via getLinkedCertificate', async () => {
    const repo = installedCertificateRepo(kind);
    await aStation(TENANT);
    const certificate = await aCertificate(TENANT, { serialNumber: 4242 });
    const installed = await repo.createInstalledCertificate(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.V2GRootCertificate,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
    });

    expect(await repo.getLinkedCertificate(TENANT, installed.id!)).toBeUndefined();

    const linked = await repo.setCertificateId(TENANT, installed.id!, certificate.id);
    expect(linked!.id).toBe(installed.id);

    const cert = await repo.getLinkedCertificate(TENANT, installed.id!);
    expect(Number(cert!.serialNumber)).toBe(4242);
    expect(cert!.issuerName).toBe('CN=Citrine Test CA');
  });

  it('updateHashData rewrites the four hash fields', async () => {
    const repo = installedCertificateRepo(kind);
    await aStation(TENANT);
    const installed = await repo.createInstalledCertificate(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.V2GRootCertificate,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      issuerNameHash: 'old-n',
      issuerKeyHash: 'old-k',
      serialNumber: 'old-s',
    });

    const updated = await repo.updateHashData(TENANT, installed.id!, {
      hashAlgorithm: HashAlgorithmEnum.SHA512,
      issuerNameHash: 'new-n',
      issuerKeyHash: 'new-k',
      serialNumber: 'new-s',
    });

    expect(updated!.hashAlgorithm).toBe('SHA512');
    expect(updated!.issuerNameHash).toBe('new-n');

    const read = await repo.findByIdAndStation(TENANT, installed.id!, STATION);
    expect(read!.issuerKeyHash).toBe('new-k');
    expect(read!.serialNumber).toBe('new-s');
  });

  it('deleteByStationAndType removes only rows of that type', async () => {
    const repo = installedCertificateRepo(kind);
    await aStation(TENANT);
    await repo.createInstalledCertificate(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.V2GRootCertificate,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
    });
    await repo.createInstalledCertificate(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.MORootCertificate,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
    });

    expect(await repo.findAllByStation(TENANT, STATION)).toHaveLength(2);

    const deleted = await repo.deleteByStationAndType(
      TENANT,
      STATION,
      CertificateUseEnum.V2GRootCertificate,
    );

    expect(deleted).toHaveLength(1);
    expect(deleted[0].certificateType).toBe('V2GRootCertificate');
    const remaining = await repo.findAllByStation(TENANT, STATION);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].certificateType).toBe('MORootCertificate');
  });

  it('deleteByStationAndHashData deletes only the matching hash tuple', async () => {
    const repo = installedCertificateRepo(kind);
    await aStation(TENANT);
    await repo.createInstalledCertificate(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.CSMSRootCertificate,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      issuerNameHash: 'n1',
      issuerKeyHash: 'k1',
      serialNumber: 's1',
    });
    await repo.createInstalledCertificate(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.CSMSRootCertificate,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      issuerNameHash: 'n1',
      issuerKeyHash: 'k1',
      serialNumber: 's2',
    });

    const deleted = await repo.deleteByStationAndHashData(TENANT, STATION, {
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      issuerNameHash: 'n1',
      issuerKeyHash: 'k1',
      serialNumber: 's1',
    });

    expect(deleted).toHaveLength(1);
    expect(deleted[0].serialNumber).toBe('s1');
    expect(await InstalledCertificate.count()).toBe(1);
  });
});

describe.each(kinds)('InstallCertificateAttempt repository (%s)', (kind) => {
  it('createAttempt resolves stationId and starts pending', async () => {
    const repo = installAttemptRepo(kind);
    const station = await aStation(TENANT);

    const created = await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.CSMSRootCertificate,
      requestId: 7,
    });

    expect(created.stationId).toBe(station.id);
    expect(created.requestId).toBe(7);
    expect(created.tenantId).toBe(TENANT);

    const pending = await repo.findPendingByStation(TENANT, STATION);
    expect(pending!.id).toBe(created.id);
    expect(pending!.status).toBeNull();
  });

  it('findPendingByStation filters by requestId, certificateType and tenant', async () => {
    const repo = installAttemptRepo(kind);
    await aStation(TENANT);
    await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.CSMSRootCertificate,
      requestId: 1,
    });
    await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.V2GRootCertificate,
      requestId: 2,
    });

    expect((await repo.findPendingByStation(TENANT, STATION, 2))!.requestId).toBe(2);
    expect(
      (await repo.findPendingByStation(
        TENANT,
        STATION,
        null,
        CertificateUseEnum.CSMSRootCertificate,
      ))!.requestId,
    ).toBe(1);
    expect(await repo.findPendingByStation(TENANT, STATION, 9)).toBeUndefined();
    expect(await repo.findPendingByStation(OTHER_TENANT, STATION)).toBeUndefined();
  });

  it('updateStatus ends the pending state and is tenant-scoped', async () => {
    const repo = installAttemptRepo(kind);
    await aStation(TENANT);
    const created = await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.CSMSRootCertificate,
    });

    expect(
      await repo.updateStatus(OTHER_TENANT, created.id!, InstallCertificateStatusEnum.Accepted),
    ).toBeUndefined();
    expect(
      await repo.updateStatus(TENANT, 999_999, InstallCertificateStatusEnum.Accepted),
    ).toBeUndefined();

    const updated = await repo.updateStatus(
      TENANT,
      created.id!,
      InstallCertificateStatusEnum.Accepted,
    );
    expect(updated!.status).toBe('Accepted');
    expect(await repo.findPendingByStation(TENANT, STATION)).toBeUndefined();
  });

  it('findPendingByStationTypeAndCertHash joins the linked certificate by file hash', async () => {
    const repo = installAttemptRepo(kind);
    await aStation(TENANT);
    const certificate = await aCertificate(TENANT, { certificateFileHash: 'fh-1' });
    const created = await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.CSMSRootCertificate,
      certificateId: certificate.id,
      requestId: 3,
    });

    const found = await repo.findPendingByStationTypeAndCertHash(
      TENANT,
      STATION,
      CertificateUseEnum.CSMSRootCertificate,
      'fh-1',
      3,
    );
    expect(found!.id).toBe(created.id);
    expect(found!.requestId).toBe(3);

    expect(
      await repo.findPendingByStationTypeAndCertHash(
        TENANT,
        STATION,
        CertificateUseEnum.CSMSRootCertificate,
        'fh-x',
      ),
    ).toBeUndefined();
  });

  it('getLinkedCertificate returns the certificate only when linked', async () => {
    const repo = installAttemptRepo(kind);
    await aStation(TENANT);
    const certificate = await aCertificate(TENANT, { serialNumber: 31337 });
    const unlinked = await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.V2GRootCertificate,
    });
    const linked = await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      certificateType: CertificateUseEnum.V2GRootCertificate,
      certificateId: certificate.id,
    });

    expect(await repo.getLinkedCertificate(TENANT, unlinked.id!)).toBeUndefined();

    const cert = await repo.getLinkedCertificate(TENANT, linked.id!);
    expect(Number(cert!.serialNumber)).toBe(31337);
    expect(cert!.issuerName).toBe('CN=Citrine Test CA');
  });
});

describe.each(kinds)('DeleteCertificateAttempt repository (%s)', (kind) => {
  it('createAttempt resolves stationId, null for an unknown station', async () => {
    const repo = deleteAttemptRepo(kind);
    const station = await aStation(TENANT);

    const resolved = await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      issuerNameHash: 'n1',
      issuerKeyHash: 'k1',
      serialNumber: 's1',
    });
    const unresolved = await repo.createAttempt(TENANT, {
      ocppConnectionName: 'GHOST',
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      issuerNameHash: 'n2',
      issuerKeyHash: 'k2',
      serialNumber: 's2',
    });

    expect(resolved.stationId).toBe(station.id);
    expect(unresolved.stationId).toBeNull();
    expect(await DeleteCertificateAttempt.count()).toBe(2);
  });

  it('findPendingByStationAndHashData matches the full hash tuple of pending rows', async () => {
    const repo = deleteAttemptRepo(kind);
    await aStation(TENANT);
    const target = await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      issuerNameHash: 'n1',
      issuerKeyHash: 'k1',
      serialNumber: 's1',
    });
    await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      issuerNameHash: 'n1',
      issuerKeyHash: 'k1',
      serialNumber: 's2',
    });

    const hashData = {
      hashAlgorithm: HashAlgorithmEnum.SHA256,
      issuerNameHash: 'n1',
      issuerKeyHash: 'k1',
      serialNumber: 's1',
    };
    const found = await repo.findPendingByStationAndHashData(TENANT, STATION, hashData);
    expect(found!.id).toBe(target.id);

    expect(
      await repo.findPendingByStationAndHashData(TENANT, STATION, {
        ...hashData,
        issuerKeyHash: 'wrong',
      }),
    ).toBeUndefined();

    await repo.updateStatus(TENANT, target.id!, DeleteCertificateStatusEnum.Accepted);
    expect(await repo.findPendingByStationAndHashData(TENANT, STATION, hashData)).toBeUndefined();
  });

  it('updateStatus writes the status and is tenant-scoped', async () => {
    const repo = deleteAttemptRepo(kind);
    await aStation(TENANT);
    const created = await repo.createAttempt(TENANT, {
      ocppConnectionName: STATION,
      hashAlgorithm: HashAlgorithmEnum.SHA384,
      issuerNameHash: 'n1',
      issuerKeyHash: 'k1',
      serialNumber: 's1',
    });

    expect(
      await repo.updateStatus(OTHER_TENANT, created.id!, DeleteCertificateStatusEnum.NotFound),
    ).toBeUndefined();

    const updated = await repo.updateStatus(
      TENANT,
      created.id!,
      DeleteCertificateStatusEnum.NotFound,
    );
    expect(updated!.status).toBe('NotFound');
    expect(await repo.findPendingByStation(TENANT, STATION)).toBeUndefined();
  });
});

describe('drizzle row-to-DTO mappers', () => {
  const timestamps = {
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  };

  it('toBootDto converts lastBootTime to ISO and maps null status to undefined', () => {
    const dto = toBootDto({
      id: 5,
      stationId: 11,
      lastBootTime: new Date('2025-05-01T10:00:00.000Z'),
      heartbeatInterval: 60,
      bootRetryInterval: null,
      status: null,
      statusInfo: { reasonCode: 'X' },
      getBaseReportOnPending: null,
      variablesRejectedOnLastBoot: null,
      bootWithRejectedVariables: true,
      changeConfigurationsOnPending: null,
      getConfigurationsOnPending: null,
      tenantId: TENANT,
      ...timestamps,
    } as BootEntity);

    expect(dto.lastBootTime).toBe('2025-05-01T10:00:00.000Z');
    expect(dto.status).toBeUndefined();
    expect(dto.bootRetryInterval).toBeNull();
    expect(dto.statusInfo).toEqual({ reasonCode: 'X' });
    expect(dto.pendingBootSetVariables).toBeUndefined();
    expect(dto.stationId).toBe(11);
  });

  it('toCertificateDto substitutes defaults for null identity columns', () => {
    const dto = toCertificateDto({
      id: 8,
      serialNumber: null,
      issuerName: null,
      organizationName: null,
      commonName: null,
      keyLength: null,
      validBefore: new Date('2030-01-01T00:00:00.000Z'),
      signatureAlgorithm: 'SHA256withRSA',
      countryName: 'US',
      isCA: null,
      pathLen: null,
      certificateFileId: null,
      certificateFileHash: 'fh',
      privateKeyFileId: null,
      signedBy: null,
      tenantId: TENANT,
      ...timestamps,
    } as CertificateEntity);

    expect(dto.serialNumber).toBe(0);
    expect(dto.issuerName).toBe('');
    expect(dto.validBefore).toBe('2030-01-01T00:00:00.000Z');
    expect(dto.isCA).toBeUndefined();
    expect(dto.certificateFileHash).toBe('fh');
  });

  it('toInstalledCertificateDto drops the stationId and certificateId columns', () => {
    const dto = toInstalledCertificateDto({
      id: 3,
      stationId: 12,
      ocppConnectionName: STATION,
      hashAlgorithm: 'SHA256',
      issuerNameHash: null,
      issuerKeyHash: 'ikh',
      serialNumber: 'sn',
      certificateType: 'CSMSRootCertificate',
      certificateId: 44,
      tenantId: TENANT,
      ...timestamps,
    } as InstalledCertificateEntity);

    expect('stationId' in dto).toBe(false);
    expect('certificateId' in dto).toBe(false);
    expect(dto.issuerNameHash).toBeNull();
    expect(dto.certificateType).toBe('CSMSRootCertificate');
  });

  it('toInstallCertificateAttemptDto maps nullable FK and status columns to null', () => {
    const dto = toInstallCertificateAttemptDto({
      id: 2,
      stationId: null,
      ocppConnectionName: STATION,
      certificateType: 'V2GRootCertificate',
      certificateId: null,
      requestId: null,
      status: null,
      tenantId: TENANT,
      ...timestamps,
    } as InstallCertificateAttemptEntity);

    expect(dto.stationId).toBeNull();
    expect(dto.certificateId).toBeNull();
    expect(dto.requestId).toBeNull();
    expect(dto.status).toBeNull();
    expect(dto.createdAt).toEqual(timestamps.createdAt);
  });

  it('toDeleteCertificateAttemptDto keeps the hash tuple and status', () => {
    const dto = toDeleteCertificateAttemptDto({
      id: 9,
      stationId: 4,
      ocppConnectionName: STATION,
      hashAlgorithm: 'SHA512',
      issuerNameHash: 'n',
      issuerKeyHash: null,
      serialNumber: 's',
      status: 'Failed',
      tenantId: TENANT,
      ...timestamps,
    } as DeleteCertificateAttemptEntity);

    expect(dto.hashAlgorithm).toBe('SHA512');
    expect(dto.issuerKeyHash).toBeNull();
    expect(dto.serialNumber).toBe('s');
    expect(dto.status).toBe('Failed');
    expect(dto.tenantId).toBe(TENANT);
  });
});
