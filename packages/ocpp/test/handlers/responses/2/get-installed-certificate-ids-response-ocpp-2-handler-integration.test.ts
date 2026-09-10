// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
  CertificateUseEnum,
  type CertificateUseEnumType,
  EventGroup,
  GetInstalledCertificateStatusEnum,
  HashAlgorithmEnum,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  type OcppRequest,
  OCPPVersion,
  type SystemConfig,
} from '@citrineos/types';
import {
  DefaultSequelizeInstance,
  type ITenantRepository,
  SequelizeInstalledCertificateRepository,
  SequelizeLocationRepository,
  SequelizeOCPPMessageRepository,
  SequelizeTenantRepository,
} from '@citrineos/dal';
import { GetInstalledCertificateIdsResponseOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * GetInstalledCertificateIds is the reconciliation call: the station answers with every certificate
 * it holds, as a list of certificateHashDataChain entries. A station legitimately holds more than
 * one certificate of a type - several V2G roots is the ordinary case, since a CPO trusts more than
 * one V2G root CA.
 *
 * Each reported certificate therefore needs its own record, identified by its hash data. Matching
 * on certificateType alone cannot tell two roots apart.
 */
const STATION = 'CP-CERT-2';

const ROOT_ONE = {
  hashAlgorithm: HashAlgorithmEnum.SHA256,
  issuerNameHash: 'issuer-name-hash-1',
  issuerKeyHash: 'issuer-key-hash-1',
  serialNumber: 'serial-1',
};
const ROOT_TWO = {
  hashAlgorithm: HashAlgorithmEnum.SHA256,
  issuerNameHash: 'issuer-name-hash-2',
  issuerKeyHash: 'issuer-key-hash-2',
  serialNumber: 'serial-2',
};

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let config: SystemConfig;
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
  installedCertificateRepository = new SequelizeInstalledCertificateRepository(deps);
  ocppMessageRepository = new SequelizeOCPPMessageRepository(deps);
  tenantRepository = new SequelizeTenantRepository(deps);
  locationRepository = new SequelizeLocationRepository(deps);
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

type CertificateHashData = typeof ROOT_ONE;

function aResponseReporting(...certificates: CertificateHashData[]): IMessage<OcppRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-1',
      timestamp: new Date().toISOString(),
    },
    payload: {
      status: GetInstalledCertificateStatusEnum.Accepted,
      certificateHashDataChain: certificates.map((certificateHashData) => ({
        certificateType: CertificateUseEnum.V2GRootCertificate,
        certificateHashData,
      })),
    },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Certificates,
    action: OCPP_CallAction.GetInstalledCertificateIds,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<OcppRequest>;
}

async function anInstalledCertificate(certificateHashData: CertificateHashData) {
  return installedCertificateRepository.createInstalledCertificate(DEFAULT_TENANT_ID, {
    ocppConnectionName: STATION,
    ...certificateHashData,
    certificateType: CertificateUseEnum.V2GRootCertificate,
  });
}

async function aManufacturerCertificate() {
  return installedCertificateRepository.createInstalledCertificate(DEFAULT_TENANT_ID, {
    ocppConnectionName: STATION,
    hashAlgorithm: ROOT_ONE.hashAlgorithm,
    issuerNameHash: 'issuer-mf',
    issuerKeyHash: 'key-mf',
    serialNumber: 'serial-mf',
    certificateType: CertificateUseEnum.ManufacturerRootCertificate,
  });
}

async function aRequestAskingFor(...certificateType: CertificateUseEnumType[]) {
  return ocppMessageRepository.createOCPPMessage(DEFAULT_TENANT_ID, {
    ocppConnectionName: STATION,
    correlationId: 'corr-1',
    origin: MessageOrigin.ChargingStationManagementSystem,
    action: OCPP_CallAction.GetInstalledCertificateIds,
    protocol: OCPPVersion.OCPP2_0_1,
    payload: { certificateType },
    raw: JSON.stringify([2, 'corr-1', 'GetInstalledCertificateIds', { certificateType }]),
    timestamp: new Date().toISOString(),
  });
}

function recordedSerialNumbers() {
  return installedCertificateRepository
    .findAllByStation(DEFAULT_TENANT_ID, STATION)
    .then((rows) => rows.map((row) => row.serialNumber).sort());
}

describe('GetInstalledCertificateIdsResponseOcpp2Handler with several certificates of one type', () => {
  const { container } = createTestContainer();

  function aHandler() {
    return getTestInstance(container, GetInstalledCertificateIdsResponseOcpp2Handler, {
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

  it('records every certificate the station reports, not only the last of each type', async () => {
    await aHandler().handle(aResponseReporting(ROOT_ONE, ROOT_TWO) as never);

    expect(await recordedSerialNumbers()).toEqual(['serial-1', 'serial-2']);
  });

  it('reconciles a station that already has two certificates of one type recorded', async () => {
    await anInstalledCertificate(ROOT_ONE);
    await anInstalledCertificate(ROOT_TWO);

    await aHandler().handle(aResponseReporting(ROOT_ONE, ROOT_TWO) as never);

    expect(await recordedSerialNumbers()).toEqual(['serial-1', 'serial-2']);
  });

  it('does not duplicate a certificate that is reported again', async () => {
    await aHandler().handle(aResponseReporting(ROOT_ONE) as never);

    await aHandler().handle(aResponseReporting(ROOT_ONE) as never);

    expect(await recordedSerialNumbers()).toEqual(['serial-1']);
  });

  it('removes a certificate the station no longer reports', async () => {
    await anInstalledCertificate(ROOT_ONE);
    await anInstalledCertificate(ROOT_TWO);

    await aHandler().handle(aResponseReporting(ROOT_TWO) as never);

    expect(await recordedSerialNumbers()).toEqual(['serial-2']);
  });

  it('removes every certificate when the station reports none of that type', async () => {
    await anInstalledCertificate(ROOT_ONE);
    await anInstalledCertificate(ROOT_TWO);

    await aHandler().handle(aResponseReporting() as never);

    expect(await recordedSerialNumbers()).toEqual([]);
  });

  it('leaves a certificate of a type the request did not ask about', async () => {
    await anInstalledCertificate(ROOT_ONE);
    await aManufacturerCertificate();
    await aRequestAskingFor(CertificateUseEnum.V2GRootCertificate);

    await aHandler().handle(aResponseReporting(ROOT_TWO) as never);

    expect(await recordedSerialNumbers()).toEqual(['serial-2', 'serial-mf']);
  });
});
