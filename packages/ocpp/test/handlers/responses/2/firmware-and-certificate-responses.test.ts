// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppResponse,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IOCPPMessageRepository } from '@citrineos/dal';
import {
  CertificateSignedResponseOcpp2Handler,
  GetBaseReportResponseOcpp2Handler,
  GetLogResponseOcpp2Handler,
  GetReportResponseOcpp2Handler,
  InstallCertificateResponseOcpp2Handler,
  PublishFirmwareResponseOcpp2Handler,
  UnpublishFirmwareResponseOcpp2Handler,
  UpdateFirmwareResponseOcpp2Handler,
} from '@handlers/index.js';
import type { InstallCertificateHelperService } from '@services/certificate/install-certificate-helper-service.js';
import { createTestContainer, getTestInstance, makeMockOcppSender } from '@test/test-container.js';
import { asValue } from 'awilix';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';
const CORRELATION_ID = 'corr-001';
const SIGN_REQUEST_ID = 42;

// Both certificate response handlers look up the original CSMS-originated request by correlation id.
const ORIGINAL_REQUEST_QUERY = {
  where: {
    ocppConnectionName: STATION,
    correlationId: CORRELATION_ID,
    origin: MessageOrigin.ChargingStationManagementSystem,
  },
};

const { container, logger } = createTestContainer();

beforeEach(() => {
  vi.clearAllMocks();
});

function makeMessage<T extends OcppResponse>(
  action: OCPP_CallAction,
  payload: T,
  protocol: OCPPVersion = OCPPVersion.OCPP2_0_1,
): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: CORRELATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Certificates,
    action,
    state: MessageState.Response,
    protocol,
  } as unknown as IMessage<T>;
}

function makeOcppMessageRepository(row: { payload: unknown } | undefined) {
  return {
    readOnlyOneByQuery: vi.fn().mockResolvedValue(row),
  } as unknown as Mocked<IOCPPMessageRepository>;
}

function makeInstallCertificateHelperService() {
  return {
    finalizeInstalledCertificate: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<InstallCertificateHelperService>;
}

describe('CertificateSignedResponseOcpp2Handler', () => {
  let ocppMessageRepository: Mocked<IOCPPMessageRepository>;
  let installCertificateHelperService: Mocked<InstallCertificateHelperService>;

  function makeHandler() {
    return getTestInstance(container, CertificateSignedResponseOcpp2Handler, {
      ocppMessageRepository,
      installCertificateHelperService,
    });
  }

  beforeEach(() => {
    installCertificateHelperService = makeInstallCertificateHelperService();
  });

  it('2.0.1 response finalizes with the request certificate type but no requestId', async () => {
    // requestId is a 2.1-only field; a 2.0.1 response drops it even when the stored request carries one.
    ocppMessageRepository = makeOcppMessageRepository({
      payload: {
        certificateChain: 'pem-chain',
        certificateType: OCPP2_1.CertificateSigningUseEnumType.ChargingStationCertificate,
        requestId: SIGN_REQUEST_ID,
      },
    });
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.CertificateSigned, {
        status: OCPP2_0_1.CertificateSignedStatusEnumType.Accepted,
      }),
    );

    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledTimes(1);
    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      ORIGINAL_REQUEST_QUERY,
    );
    expect(installCertificateHelperService.finalizeInstalledCertificate).toHaveBeenCalledTimes(1);
    expect(installCertificateHelperService.finalizeInstalledCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      OCPP2_0_1.InstallCertificateStatusEnumType.Accepted,
      undefined,
      OCPP2_1.CertificateSigningUseEnumType.ChargingStationCertificate,
    );
  });

  it('2.1 response forwards the requestId from the original request', async () => {
    ocppMessageRepository = makeOcppMessageRepository({
      payload: {
        certificateChain: 'pem-chain',
        certificateType: OCPP2_1.CertificateSigningUseEnumType.V2GCertificate,
        requestId: SIGN_REQUEST_ID,
      },
    });
    const handler = makeHandler();

    await handler.handle(
      makeMessage(
        OCPP_CallAction.CertificateSigned,
        { status: OCPP2_1.CertificateSignedStatusEnumType.Rejected },
        OCPPVersion.OCPP2_1,
      ),
    );

    expect(installCertificateHelperService.finalizeInstalledCertificate).toHaveBeenCalledTimes(1);
    expect(installCertificateHelperService.finalizeInstalledCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      OCPP2_1.InstallCertificateStatusEnumType.Rejected,
      SIGN_REQUEST_ID,
      OCPP2_1.CertificateSigningUseEnumType.V2GCertificate,
    );
  });

  it('missing original request still finalizes, with undefined requestId and type', async () => {
    ocppMessageRepository = makeOcppMessageRepository(undefined);
    const handler = makeHandler();

    await handler.handle(
      makeMessage(
        OCPP_CallAction.CertificateSigned,
        { status: OCPP2_1.CertificateSignedStatusEnumType.Accepted },
        OCPPVersion.OCPP2_1,
      ),
    );

    expect(installCertificateHelperService.finalizeInstalledCertificate).toHaveBeenCalledTimes(1);
    expect(installCertificateHelperService.finalizeInstalledCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      OCPP2_1.InstallCertificateStatusEnumType.Accepted,
      undefined,
      undefined,
    );
  });

  it('repository failure propagates and skips finalization', async () => {
    ocppMessageRepository = {
      readOnlyOneByQuery: vi.fn().mockRejectedValue(new Error('db down')),
    } as unknown as Mocked<IOCPPMessageRepository>;
    const handler = makeHandler();

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.CertificateSigned, {
          status: OCPP2_0_1.CertificateSignedStatusEnumType.Accepted,
        }),
      ),
    ).rejects.toThrow('db down');

    expect(installCertificateHelperService.finalizeInstalledCertificate).not.toHaveBeenCalled();
  });
});

describe('InstallCertificateResponseOcpp2Handler', () => {
  let ocppMessageRepository: Mocked<IOCPPMessageRepository>;
  let installCertificateHelperService: Mocked<InstallCertificateHelperService>;

  function makeHandler() {
    return getTestInstance(container, InstallCertificateResponseOcpp2Handler, {
      ocppMessageRepository,
      installCertificateHelperService,
    });
  }

  beforeEach(() => {
    installCertificateHelperService = makeInstallCertificateHelperService();
  });

  it('finalizes with the certificate type from the original request and no requestId', async () => {
    ocppMessageRepository = makeOcppMessageRepository({
      payload: {
        certificate: 'pem-cert',
        certificateType: OCPP2_0_1.InstallCertificateUseEnumType.CSMSRootCertificate,
      },
    });
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.InstallCertificate, {
        status: OCPP2_0_1.InstallCertificateStatusEnumType.Accepted,
      }),
    );

    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledTimes(1);
    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      ORIGINAL_REQUEST_QUERY,
    );
    expect(installCertificateHelperService.finalizeInstalledCertificate).toHaveBeenCalledTimes(1);
    expect(installCertificateHelperService.finalizeInstalledCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      OCPP2_0_1.InstallCertificateStatusEnumType.Accepted,
      undefined,
      OCPP2_0_1.InstallCertificateUseEnumType.CSMSRootCertificate,
    );
  });

  it('missing original request finalizes with undefined certificate type', async () => {
    ocppMessageRepository = makeOcppMessageRepository(undefined);
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.InstallCertificate, {
        status: OCPP2_0_1.InstallCertificateStatusEnumType.Failed,
      }),
    );

    expect(installCertificateHelperService.finalizeInstalledCertificate).toHaveBeenCalledTimes(1);
    expect(installCertificateHelperService.finalizeInstalledCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      OCPP2_0_1.InstallCertificateStatusEnumType.Failed,
      undefined,
      undefined,
    );
  });

  it('finalization failure propagates to the caller', async () => {
    ocppMessageRepository = makeOcppMessageRepository({
      payload: {
        certificate: 'pem-cert',
        certificateType: OCPP2_0_1.InstallCertificateUseEnumType.MORootCertificate,
      },
    });
    installCertificateHelperService.finalizeInstalledCertificate.mockRejectedValue(
      new Error('finalize failed'),
    );
    const handler = makeHandler();

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.InstallCertificate, {
          status: OCPP2_0_1.InstallCertificateStatusEnumType.Rejected,
        }),
      ),
    ).rejects.toThrow('finalize failed');

    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledTimes(1);
  });
});

// The five handlers below are log-only stubs: the constructor takes only the logger. A mock
// sender and repository are registered in the container so the tests can prove the handler
// never resolves or uses them.
function makeStubHarness() {
  const ocppSender = makeMockOcppSender();
  const ocppMessageRepository = makeOcppMessageRepository({ payload: {} });
  container.register({
    ocppSender: asValue(ocppSender),
    ocppMessageRepository: asValue(ocppMessageRepository),
  });
  return { ocppSender, ocppMessageRepository };
}

describe('UpdateFirmwareResponseOcpp2Handler', () => {
  it('resolves and only debug-logs the response', async () => {
    const { ocppSender, ocppMessageRepository } = makeStubHarness();
    const handler = getTestInstance(container, UpdateFirmwareResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.UpdateFirmware, {
      status: OCPP2_0_1.UpdateFirmwareStatusEnumType.AcceptedCanceled,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      'Handler for UpdateFirmwareResponse received message:',
      message,
      undefined,
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResult).not.toHaveBeenCalled();
    expect(ocppMessageRepository.readOnlyOneByQuery).not.toHaveBeenCalled();
  });
});

describe('UnpublishFirmwareResponseOcpp2Handler', () => {
  it('resolves and only debug-logs the response', async () => {
    const { ocppSender, ocppMessageRepository } = makeStubHarness();
    const handler = getTestInstance(container, UnpublishFirmwareResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.UnpublishFirmware, {
      status: OCPP2_0_1.UnpublishFirmwareStatusEnumType.DownloadOngoing,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      'Handler for UnpublishFirmwareResponse received message:',
      message,
      undefined,
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResult).not.toHaveBeenCalled();
    expect(ocppMessageRepository.readOnlyOneByQuery).not.toHaveBeenCalled();
  });
});

describe('PublishFirmwareResponseOcpp2Handler', () => {
  it('resolves and only debug-logs the response', async () => {
    const { ocppSender, ocppMessageRepository } = makeStubHarness();
    const handler = getTestInstance(container, PublishFirmwareResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.PublishFirmware, {
      status: OCPP2_0_1.GenericStatusEnumType.Rejected,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      'Handler for PublishFirmwareResponse received message:',
      message,
      undefined,
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResult).not.toHaveBeenCalled();
    expect(ocppMessageRepository.readOnlyOneByQuery).not.toHaveBeenCalled();
  });
});

describe('GetLogResponseOcpp2Handler', () => {
  it('resolves and only debug-logs the response', async () => {
    const { ocppSender, ocppMessageRepository } = makeStubHarness();
    const handler = getTestInstance(container, GetLogResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.GetLog, {
      status: OCPP2_0_1.LogStatusEnumType.Accepted,
      filename: 'diagnostics.log',
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      'Handler for GetLogResponse received message:',
      message,
      undefined,
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResult).not.toHaveBeenCalled();
    expect(ocppMessageRepository.readOnlyOneByQuery).not.toHaveBeenCalled();
  });
});

describe('GetBaseReportResponseOcpp2Handler', () => {
  it('resolves and only debug-logs the response', async () => {
    const { ocppSender, ocppMessageRepository } = makeStubHarness();
    const handler = getTestInstance(container, GetBaseReportResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.GetBaseReport, {
      status: OCPP2_0_1.GenericDeviceModelStatusEnumType.Accepted,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith(
      'Handler for GetBaseReportResponse received message:',
      message,
      undefined,
    );
    expect(logger.error).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResult).not.toHaveBeenCalled();
    expect(ocppMessageRepository.readOnlyOneByQuery).not.toHaveBeenCalled();
  });
});

describe('GetReportResponseOcpp2Handler', () => {
  function makeHandler() {
    return getTestInstance(container, GetReportResponseOcpp2Handler, {});
  }

  it('Accepted logs no error', async () => {
    const handler = makeHandler();

    await expect(
      handler.handle(
        makeMessage(OCPP_CallAction.GetReport, {
          status: OCPP2_0_1.GenericDeviceModelStatusEnumType.Accepted,
        }),
      ),
    ).resolves.toBeUndefined();

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('EmptyResultSet logs no error', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.GetReport, {
        status: OCPP2_0_1.GenericDeviceModelStatusEnumType.EmptyResultSet,
      }),
    );

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('Rejected logs the failure with the statusInfo details', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.GetReport, {
        status: OCPP2_0_1.GenericDeviceModelStatusEnumType.Rejected,
        statusInfo: { reasonCode: 'InternalError', additionalInfo: 'variable store offline' },
      }),
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to get report.',
      OCPP2_0_1.GenericDeviceModelStatusEnumType.Rejected,
      'InternalError',
      'variable store offline',
    );
  });

  it('NotSupported without statusInfo logs undefined detail fields', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.GetReport, {
        status: OCPP2_0_1.GenericDeviceModelStatusEnumType.NotSupported,
      }),
    );

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to get report.',
      OCPP2_0_1.GenericDeviceModelStatusEnumType.NotSupported,
      undefined,
      undefined,
    );
  });
});
