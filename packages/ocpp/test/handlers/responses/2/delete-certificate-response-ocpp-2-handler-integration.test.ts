// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
  CertificateUseEnum,
  type DeleteCertificateAttemptDto,
  DeleteCertificateStatusEnum,
  EventGroup,
  HashAlgorithmEnum,
  MessageOrigin,
  MessageState,
  MessageTypeId,
  OCPP_CallAction,
  type OcppRequest,
  OCPPVersion,
  type SystemConfig,
} from '@citrineos/types';
import {
  DefaultSequelizeInstance,
  type ITenantRepository,
  SequelizeDeleteCertificateAttemptRepository,
  SequelizeInstalledCertificateRepository,
  SequelizeLocationRepository,
  SequelizeOCPPMessageRepository,
  SequelizeTenantRepository,
} from '@citrineos/dal';
import { DeleteCertificateResponseOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * DeleteCertificate carries the certificate to remove as certificateHashData, and the endpoint
 * records a pending DeleteCertificateAttempt holding that hash before the request goes out. Two
 * deletes on one station - clearing out a pair of superseded roots, say - therefore leave two
 * pending rows.
 *
 * The response says only whether the station accepted, so the handler has to work out which
 * certificate is being answered for. Getting it wrong destroys InstalledCertificate rows for a
 * certificate the station still holds.
 */
const STATION = 'CP-CERT-1';
const CORRELATION_A = 'corr-a';
const CORRELATION_B = 'corr-b';

const CERT_A = {
  hashAlgorithm: HashAlgorithmEnum.SHA256,
  issuerNameHash: 'issuer-name-hash-a',
  issuerKeyHash: 'issuer-key-hash-a',
  serialNumber: 'serial-a',
};
const CERT_B = {
  hashAlgorithm: HashAlgorithmEnum.SHA256,
  issuerNameHash: 'issuer-name-hash-b',
  issuerKeyHash: 'issuer-key-hash-b',
  serialNumber: 'serial-b',
};

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let config: SystemConfig;
let deleteCertificateAttemptRepository: SequelizeDeleteCertificateAttemptRepository;
let installedCertificateRepository: SequelizeInstalledCertificateRepository;
let ocppMessageRepository: SequelizeOCPPMessageRepository;
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
  deleteCertificateAttemptRepository = new SequelizeDeleteCertificateAttemptRepository(deps);
  installedCertificateRepository = new SequelizeInstalledCertificateRepository(deps);
  ocppMessageRepository = new SequelizeOCPPMessageRepository(deps);
  tenantRepository = new SequelizeTenantRepository(deps);
  locationRepository = new SequelizeLocationRepository(deps);
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

type CertificateHashData = typeof CERT_A;

/** The request the endpoint sent, which is what says which certificate a response answers for. */
async function aDeleteCertificateRequest(
  correlationId: string,
  certificateHashData: CertificateHashData,
) {
  const payload = { certificateHashData };
  return ocppMessageRepository.createOCPPMessage(DEFAULT_TENANT_ID, {
    ocppConnectionName: STATION,
    correlationId,
    origin: MessageOrigin.ChargingStationManagementSystem,
    type: MessageTypeId.Call,
    protocol: OCPPVersion.OCPP2_0_1,
    action: 'DeleteCertificate',
    payload,
    raw: JSON.stringify([MessageTypeId.Call, correlationId, 'DeleteCertificate', payload]),
    timestamp: new Date().toISOString(),
  });
}

/** A pending attempt, as prepareToDeleteCertificate leaves one before the request goes out. */
async function aPendingDeleteAttempt(certificateHashData: CertificateHashData) {
  return deleteCertificateAttemptRepository.createAttempt(DEFAULT_TENANT_ID, {
    ocppConnectionName: STATION,
    ...certificateHashData,
    status: null,
  });
}

async function anInstalledCertificate(certificateHashData: CertificateHashData) {
  return installedCertificateRepository.createInstalledCertificate(DEFAULT_TENANT_ID, {
    ocppConnectionName: STATION,
    ...certificateHashData,
    certificateType: CertificateUseEnum.V2GRootCertificate,
  });
}

function anAcceptedResponse(correlationId: string): IMessage<OcppRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId,
      timestamp: new Date().toISOString(),
    },
    payload: { status: DeleteCertificateStatusEnum.Accepted },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Certificates,
    action: OCPP_CallAction.DeleteCertificate,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<OcppRequest>;
}

function statusOf(attempt: DeleteCertificateAttemptDto) {
  return deleteCertificateAttemptRepository
    .readByKey(DEFAULT_TENANT_ID, attempt.id!)
    .then((row) => row?.status ?? null);
}

function installedCertificatesFor(serialNumber: string) {
  return installedCertificateRepository
    .findAllByStation(DEFAULT_TENANT_ID, STATION)
    .then((rows) => rows.filter((row) => row.serialNumber === serialNumber).length);
}

describe('DeleteCertificateResponseOcpp2Handler with more than one delete in flight', () => {
  const { container } = createTestContainer();

  function aHandler() {
    return getTestInstance(container, DeleteCertificateResponseOcpp2Handler, {
      deleteCertificateAttemptRepository,
      installedCertificateRepository,
      ocppMessageRepository,
    });
  }

  beforeEach(async () => {
    await sequelizeInstance.truncate({ cascade: true, restartIdentity: true });

    await tenantRepository.createTenant({ id: DEFAULT_TENANT_ID, name: 'A', isUserTenant: false });
    await locationRepository.createOrUpdateChargingStation(DEFAULT_TENANT_ID, {
      ocppConnectionName: STATION,
      isOnline: true,
    });
  });

  it('settles the attempt for the certificate that was answered', async () => {
    const attemptA = await aPendingDeleteAttempt(CERT_A);
    const attemptB = await aPendingDeleteAttempt(CERT_B);
    await aDeleteCertificateRequest(CORRELATION_B, CERT_B);

    await aHandler().handle(anAcceptedResponse(CORRELATION_B) as never);

    expect(await statusOf(attemptB)).toBe(DeleteCertificateStatusEnum.Accepted);
    expect(await statusOf(attemptA)).toBeNull();
  });

  it('does not remove the record of a certificate the station still holds', async () => {
    // Only the delete for B was answered, so A must survive untouched.
    await aPendingDeleteAttempt(CERT_A);
    await anInstalledCertificate(CERT_A);
    await aDeleteCertificateRequest(CORRELATION_B, CERT_B);

    await aHandler().handle(anAcceptedResponse(CORRELATION_B) as never);

    expect(await installedCertificatesFor(CERT_A.serialNumber)).toBe(1);
  });

  it('removes the record of the certificate that was deleted', async () => {
    await aPendingDeleteAttempt(CERT_A);
    await anInstalledCertificate(CERT_A);
    await aDeleteCertificateRequest(CORRELATION_A, CERT_A);

    await aHandler().handle(anAcceptedResponse(CORRELATION_A) as never);

    expect(await installedCertificatesFor(CERT_A.serialNumber)).toBe(0);
  });
});
