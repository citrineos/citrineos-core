// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import type { Sequelize as SequelizeInstance } from 'sequelize-typescript';
import { QueryTypes, Sequelize } from 'sequelize';
import { type BootstrapConfig, DEFAULT_TENANT_ID } from '@citrineos/base';
import type { CertificateCreate, SystemConfig } from '@citrineos/types';
import { DefaultSequelizeInstance, SequelizeCertificateRepository } from '@citrineos/dal';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations/', import.meta.url));
const OTHER_TENANT_ID = DEFAULT_TENANT_ID + 1;
const ISSUER = 'CN=V2G Root CA, O=Example, C=DE';

let pgContainer: StartedTestContainer;
let sequelizeInstance: SequelizeInstance;

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

  sequelizeInstance = DefaultSequelizeInstance.getInstance({
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
  } as unknown as BootstrapConfig);
  const queryInterface = sequelizeInstance.getQueryInterface();

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.ts'))
    .sort();
  for (const file of files) {
    const migration = await import(`${MIGRATIONS_DIR}${file}`);
    await (migration.default ?? migration).up(queryInterface, Sequelize);
  }

  await sequelizeInstance.query(
    `INSERT INTO "Tenants" (id, name, "createdAt", "updatedAt") VALUES ($1, 'Other', now(), now())`,
    { bind: [OTHER_TENANT_ID] },
  );
}, 180_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

function storeCertificate(tenantId: number, serialNumber: number) {
  return sequelizeInstance.query(
    `INSERT INTO "Certificates" ("tenantId", "serialNumber", "issuerName", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, now(), now())`,
    { bind: [tenantId, serialNumber, ISSUER] },
  );
}

function aCertificate(tenantId: number, serialNumber: number): CertificateCreate {
  return {
    tenantId,
    serialNumber,
    issuerName: ISSUER,
    organizationName: 'Example',
    commonName: 'V2G Root CA',
  };
}

async function tenantsHolding(serialNumber: number): Promise<number[]> {
  const rows = await sequelizeInstance.query<{ tenantId: number }>(
    'SELECT "tenantId" FROM "Certificates" WHERE "serialNumber" = $1 ORDER BY "tenantId"',
    { bind: [serialNumber], type: QueryTypes.SELECT },
  );
  return rows.map((row) => row.tenantId);
}

describe('Certificates uniqueness on a fully migrated database', () => {
  it('lets two tenants each store the same CA certificate', async () => {
    await storeCertificate(DEFAULT_TENANT_ID, 1001);

    await expect(storeCertificate(OTHER_TENANT_ID, 1001)).resolves.toBeDefined();
  });

  it('still rejects the same certificate twice within one tenant', async () => {
    await storeCertificate(DEFAULT_TENANT_ID, 2002);

    await expect(storeCertificate(DEFAULT_TENANT_ID, 2002)).rejects.toMatchObject({
      parent: { constraint: 'tenantId_serialNumber_issuerName' },
    });
  });

  it('stores the certificate for the second tenant through createOrUpdateCertificate', async () => {
    const repository = new SequelizeCertificateRepository({
      config: {} as SystemConfig,
      sequelizeInstance,
    });
    await repository.createOrUpdateCertificate(
      DEFAULT_TENANT_ID,
      aCertificate(DEFAULT_TENANT_ID, 3003),
    );

    const stored = await repository.createOrUpdateCertificate(
      OTHER_TENANT_ID,
      aCertificate(OTHER_TENANT_ID, 3003),
    );

    expect(stored?.tenantId).toBe(OTHER_TENANT_ID);
    expect(await tenantsHolding(3003)).toEqual([DEFAULT_TENANT_ID, OTHER_TENANT_ID]);
  });
});
