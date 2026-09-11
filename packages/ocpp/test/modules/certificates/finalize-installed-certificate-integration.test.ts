// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  CertificateUseEnum,
  type CertificateUseEnumType,
  type InstallCertificateAttemptDto,
  InstallCertificateStatusEnum,
  type SystemConfig,
} from '@citrineos/types';
import {
  DefaultSequelizeInstance,
  type ITenantRepository,
  SequelizeCertificateRepository,
  SequelizeDeleteCertificateAttemptRepository,
  SequelizeInstallCertificateAttemptRepository,
  SequelizeInstalledCertificateRepository,
  SequelizeLocationRepository,
  SequelizeTenantRepository,
} from '@citrineos/dal';
import { InstallCertificateHelperService } from '@services/certificate/install-certificate-helper-service.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { Logger } from 'tslog';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * A station can have more than one certificate install in flight: the endpoint prepares an attempt
 * before sending InstallCertificate, and SignCertificate prepares another before sending
 * CertificateSigned. Both write a row with a null status, and the two paths use disjoint
 * certificateType values - roots from the former, leaves from the latter.
 *
 * finalizeInstalledCertificate has to settle the attempt the station is answering. It reaches the
 * pending row by station, narrowing by requestId only when one is present, and requestId is an
 * OCPP 2.1 field - so on 2.0.1 there is nothing to tell two pending attempts apart.
 */
const STATION = 'CP-PNC-1';

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let config: SystemConfig;
let certificateRepository: SequelizeCertificateRepository;
let installCertificateAttemptRepository: SequelizeInstallCertificateAttemptRepository;
let tenantRepository: ITenantRepository;
let locationRepository: SequelizeLocationRepository;

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

  config = {
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

  sequelizeInstance = DefaultSequelizeInstance.getInstance(config);
  await sequelizeInstance.query('CREATE EXTENSION IF NOT EXISTS citext;');
  await sequelizeInstance.sync({ force: true });

  const deps = { config, logger: undefined, sequelizeInstance } as never;
  certificateRepository = new SequelizeCertificateRepository(deps);
  installCertificateAttemptRepository = new SequelizeInstallCertificateAttemptRepository(deps);
  tenantRepository = new SequelizeTenantRepository(deps);
  locationRepository = new SequelizeLocationRepository(deps);
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

function aService() {
  const deps = { config, logger: undefined, sequelizeInstance } as never;
  return new InstallCertificateHelperService({
    certificateRepository: new SequelizeCertificateRepository(deps),
    installedCertificateRepository: new SequelizeInstalledCertificateRepository(deps),
    installCertificateAttemptRepository: new SequelizeInstallCertificateAttemptRepository(deps),
    deleteCertificateAttemptRepository: new SequelizeDeleteCertificateAttemptRepository(deps),
    // Unreachable for a finalize that settles an attempt row.
    deviceModelRepository: {} as never,
    certificateAuthorityService: {} as never,
    fileStorage: { getFile: async () => undefined } as never,
    logger: new Logger({ type: 'hidden' }),
  });
}

let nextSerialNumber = 1;

/** A pending attempt, as either prepare path leaves one before the request goes out. */
async function aPendingAttempt(certificateType: CertificateUseEnumType) {
  const certificate = await certificateRepository.createCertificate(DEFAULT_TENANT_ID, {
    serialNumber: nextSerialNumber++,
    issuerName: 'issuer',
    organizationName: 'org',
    commonName: certificateType,
    certificateFileHash: `${certificateType}-hash`,
  });

  return installCertificateAttemptRepository.createAttempt(DEFAULT_TENANT_ID, {
    ocppConnectionName: STATION,
    certificateType,
    certificateId: certificate.id,
    status: null,
  });
}

function statusOf(attempt: InstallCertificateAttemptDto) {
  return installCertificateAttemptRepository
    .readByKey(DEFAULT_TENANT_ID, attempt.id!)
    .then((row) => row?.status ?? null);
}

describe('finalizeInstalledCertificate with more than one certificate in flight', () => {
  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });

    await tenantRepository.createTenant({ id: DEFAULT_TENANT_ID, name: 'A', isUserTenant: false });
    await locationRepository.createOrUpdateChargingStation(DEFAULT_TENANT_ID, {
      ocppConnectionName: STATION,
      isOnline: true,
    });
  });

  it('settles the attempt for the certificate that was answered', async () => {
    const root = await aPendingAttempt(CertificateUseEnum.V2GRootCertificate);
    const leaf = await aPendingAttempt('ChargingStationCertificate' as CertificateUseEnumType);

    await aService().finalizeInstalledCertificate(
      DEFAULT_TENANT_ID,
      STATION,
      InstallCertificateStatusEnum.Accepted,
      undefined,
      'ChargingStationCertificate' as never,
    );

    expect(await statusOf(leaf)).toBe(InstallCertificateStatusEnum.Accepted);
    expect(await statusOf(root)).toBeNull();
  });

  it('settles a lone pending attempt, the case that already worked', async () => {
    const root = await aPendingAttempt(CertificateUseEnum.V2GRootCertificate);

    await aService().finalizeInstalledCertificate(
      DEFAULT_TENANT_ID,
      STATION,
      InstallCertificateStatusEnum.Accepted,
      undefined,
      CertificateUseEnum.V2GRootCertificate,
    );

    expect(await statusOf(root)).toBe(InstallCertificateStatusEnum.Accepted);
  });

  it('does not settle an attempt for a certificate type the station did not answer for', async () => {
    const root = await aPendingAttempt(CertificateUseEnum.V2GRootCertificate);

    await aService().finalizeInstalledCertificate(
      DEFAULT_TENANT_ID,
      STATION,
      InstallCertificateStatusEnum.Accepted,
      undefined,
      'ChargingStationCertificate' as never,
    );

    expect(await statusOf(root)).toBeNull();
  });
});
