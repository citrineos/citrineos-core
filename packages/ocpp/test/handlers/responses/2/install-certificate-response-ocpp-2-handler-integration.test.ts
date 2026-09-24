// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
  CertificateUseEnum,
  EventGroup,
  InstallCertificateStatusEnum,
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
  SequelizeCertificateRepository,
  SequelizeDeleteCertificateAttemptRepository,
  SequelizeInstallCertificateAttemptRepository,
  SequelizeInstalledCertificateRepository,
  SequelizeOCPPMessageRepository,
} from '@citrineos/dal';
import {
  Certificate,
  ChargingStation,
  InstallCertificateAttempt,
  InstalledCertificate,
  OCPPMessage,
  Tenant,
} from '@dal/db/sequelize/index.js';
import { InstallCertificateResponseOcpp2Handler } from '@handlers/index.js';
import { InstallCertificateHelperService } from '@services/certificate/install-certificate-helper-service.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import type { Sequelize } from 'sequelize-typescript';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { Logger } from 'tslog';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFile } from '../../../helpers/file-util.js';

const STATION = 'CP-ROOT-1';
const CORRELATION_ID = 'corr-install';
const ROOT_PEM = readFile('RootCertificateSample.pem');
const OTHER_PEM = readFile('SubCACertificateSample.pem');

let pgContainer: StartedTestContainer;
let sequelizeInstance: Sequelize;
let config: SystemConfig;

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
}, 90_000);

afterAll(async () => {
  await sequelizeInstance?.close();
  await pgContainer?.stop();
});

function aHelperService() {
  const deps = { config, logger: undefined, sequelizeInstance } as never;
  return new InstallCertificateHelperService({
    certificateRepository: new SequelizeCertificateRepository(deps),
    installedCertificateRepository: new SequelizeInstalledCertificateRepository(deps),
    installCertificateAttemptRepository: new SequelizeInstallCertificateAttemptRepository(deps),
    deleteCertificateAttemptRepository: new SequelizeDeleteCertificateAttemptRepository(deps),
    variableAttributeRepository: {} as never,
    certificateAuthorityService: {} as never,
    fileStorage: { getFile: async () => undefined } as never,
    logger: new Logger({ type: 'hidden' }),
  });
}

let nextSerialNumber = 1;
let stationId: number;

async function aPendingAttempt(certificatePem: string) {
  const certificate = await Certificate.create({
    serialNumber: nextSerialNumber++,
    issuerName: 'issuer',
    organizationName: 'org',
    commonName: 'root',
    certificateFileHash: aHelperService().getCertificateHash(certificatePem),
    tenantId: DEFAULT_TENANT_ID,
  } as never);

  return InstallCertificateAttempt.create({
    stationId,
    certificateType: CertificateUseEnum.V2GRootCertificate,
    certificateId: (certificate as unknown as { id: number }).id,
    status: null,
    tenantId: DEFAULT_TENANT_ID,
  } as never);
}

async function anInstallCertificateRequest(certificatePem: string) {
  const payload = {
    certificateType: CertificateUseEnum.V2GRootCertificate,
    certificate: certificatePem,
  };
  return OCPPMessage.create({
    stationId,
    correlationId: CORRELATION_ID,
    origin: MessageOrigin.ChargingStationManagementSystem,
    type: MessageTypeId.Call,
    protocol: OCPPVersion.OCPP2_0_1,
    action: OCPP_CallAction.InstallCertificate,
    payload,
    raw: JSON.stringify([
      MessageTypeId.Call,
      CORRELATION_ID,
      OCPP_CallAction.InstallCertificate,
      payload,
    ]),
    timestamp: new Date().toISOString(),
    tenantId: DEFAULT_TENANT_ID,
  } as never);
}

function anAcceptedResponse(): IMessage<OcppRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: CORRELATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload: { status: InstallCertificateStatusEnum.Accepted },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Certificates,
    action: OCPP_CallAction.InstallCertificate,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<OcppRequest>;
}

function statusOf(attempt: InstallCertificateAttempt) {
  return InstallCertificateAttempt.findByPk((attempt as unknown as { id: number }).id).then(
    (row) => row?.status ?? null,
  );
}

describe('InstallCertificateResponseOcpp2Handler with an earlier install of that type unanswered', () => {
  const { container } = createTestContainer();

  function aHandler() {
    const deps = { config, logger: undefined, sequelizeInstance } as never;
    return getTestInstance(container, InstallCertificateResponseOcpp2Handler, {
      ocppMessageRepository: new SequelizeOCPPMessageRepository(deps),
      installCertificateHelperService: aHelperService(),
    });
  }

  beforeEach(async () => {
    await OCPPMessage.destroy({ where: {}, truncate: true, cascade: true });
    await InstalledCertificate.destroy({ where: {}, truncate: true, cascade: true });
    await InstallCertificateAttempt.destroy({ where: {}, truncate: true, cascade: true });
    await Certificate.destroy({ where: {}, truncate: true, cascade: true });
    await ChargingStation.destroy({ where: {}, truncate: true, cascade: true });
    await Tenant.destroy({ where: {}, truncate: true, cascade: true });

    await Tenant.create({ id: DEFAULT_TENANT_ID, name: 'A' } as never);
    const station = await ChargingStation.create({
      ocppConnectionName: STATION,
      isOnline: true,
      tenantId: DEFAULT_TENANT_ID,
    } as never);
    stationId = (station as unknown as { id: number }).id;
  });

  it('settles the attempt for the certificate the station accepted', async () => {
    const unanswered = await aPendingAttempt(OTHER_PEM);
    const answered = await aPendingAttempt(ROOT_PEM);
    await anInstallCertificateRequest(ROOT_PEM);

    await aHandler().handle(anAcceptedResponse() as never);

    expect(await statusOf(answered)).toBe(InstallCertificateStatusEnum.Accepted);
    expect(await statusOf(unanswered)).toBeNull();
  });
});
