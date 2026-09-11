// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type AbstractHandlerDependencies,
  type IMessage,
  type IOcppSender,
  type IVatProvider,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import {
  type CallAction,
  type OcppRequest,
  DataTransferStatusEnum,
  ErrorCode,
  EventGroup,
  Iso15118EVCertificateStatusEnum,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import {
  ClearedChargingLimitRequestOcpp2Handler,
  DataTransferRequestOcpp2Handler,
  FirmwareStatusNotificationRequestOcpp2Handler,
  Get15118EVCertificateRequestOcpp2Handler,
  GetCertificateStatusRequestOcpp2Handler,
  HeartbeatRequestOcpp2Handler,
  LogStatusNotificationRequestOcpp2Handler,
  NotifyChargingLimitRequestOcpp2Handler,
  VatNumberValidationRequestOcpp21Handler,
} from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender, mockDeps } from '@test/test-container.js';
import { createOcspRequest, sendOCSPRequest } from '@services/certificate/certificate-util.js';
import type { CertificateAuthorityService } from '@services/index.js';

// GetCertificateStatusRequestOcpp2Handler calls these as module-level functions, so they are
// mocked at the module boundary. The rest of the certificate util module stays real.
vi.mock('@services/certificate/certificate-util.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@services/certificate/certificate-util.js')>()),
  createOcspRequest: vi.fn(),
  sendOCSPRequest: vi.fn(),
}));

function makeMessage<T extends OcppRequest>(
  payload: T,
  action: CallAction,
  protocol: OCPPVersion = OCPPVersion.OCPP2_0_1,
): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.All,
    action,
    state: MessageState.Request,
    protocol,
  } as unknown as IMessage<T>;
}

function sentResponse<T>(ocppSender: ReturnType<typeof makeMockOcppSender>): T {
  expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
  return ocppSender.sendCallResultWithMessage.mock.calls[0][1] as T;
}

type SimpleHandlerDeps = AbstractHandlerDependencies & { ocppSender: IOcppSender };

// Handlers whose only dependencies are logger and ocppSender.
function makeSimpleHandler<T>(Handler: new (deps: SimpleHandlerDeps) => T) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();
  const handler = new Handler({ logger, ocppSender });
  return { handler, ocppSender, logger };
}

describe('Get15118EVCertificateRequestOcpp2Handler', () => {
  const request = {
    iso15118SchemaVersion: 'urn:iso:15118:2:2013:MsgDef',
    action: OCPP2_1.CertificateActionEnumType.Install,
    exiRequest: 'exi-request-data',
  } as OCPP2_1.Get15118EVCertificateRequest;

  function makeHandler() {
    const { logger } = createTestContainer();
    const ocppSender = makeMockOcppSender();
    const getSignedContractData = vi.fn();
    const handler = new Get15118EVCertificateRequestOcpp2Handler(
      mockDeps<typeof Get15118EVCertificateRequestOcpp2Handler>({
        logger,
        ocppSender,
        certificateAuthorityService: {
          getSignedContractData,
        } as unknown as Partial<CertificateAuthorityService>,
      }),
    );
    return { handler, ocppSender, getSignedContractData };
  }

  it('sends Accepted with the signed contract data', async () => {
    const { handler, ocppSender, getSignedContractData } = makeHandler();
    getSignedContractData.mockResolvedValue('exi-response-data');
    const message = makeMessage(request, OCPP_CallAction.Get15118EVCertificate);

    await handler.handle(message);

    expect(getSignedContractData).toHaveBeenCalledOnce();
    expect(getSignedContractData).toHaveBeenCalledWith(
      'urn:iso:15118:2:2013:MsgDef',
      'exi-request-data',
    );
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);
    expect(sentResponse(ocppSender)).toEqual({
      status: Iso15118EVCertificateStatusEnum.Accepted,
      exiResponse: 'exi-response-data',
    });
  });

  it('sends Failed with the error message when the CA service throws an Error', async () => {
    const { handler, ocppSender, getSignedContractData } = makeHandler();
    getSignedContractData.mockRejectedValue(new Error('contract data unavailable'));

    await handler.handle(makeMessage(request, OCPP_CallAction.Get15118EVCertificate));

    expect(sentResponse(ocppSender)).toEqual({
      status: Iso15118EVCertificateStatusEnum.Failed,
      statusInfo: {
        reasonCode: ErrorCode.GenericError,
        additionalInfo: 'contract data unavailable',
      },
      exiResponse: '',
    });
  });

  it('sends Failed without additionalInfo when the CA service throws a non-Error', async () => {
    const { handler, ocppSender, getSignedContractData } = makeHandler();
    getSignedContractData.mockRejectedValue('string failure');

    await handler.handle(makeMessage(request, OCPP_CallAction.Get15118EVCertificate));

    const response = sentResponse<OCPP2_1.Get15118EVCertificateResponse>(ocppSender);
    expect(response.status).toBe(Iso15118EVCertificateStatusEnum.Failed);
    expect(response.statusInfo?.reasonCode).toBe(ErrorCode.GenericError);
    expect(response.statusInfo?.additionalInfo).toBeUndefined();
    expect(response.exiResponse).toBe('');
  });
});

describe('GetCertificateStatusRequestOcpp2Handler', () => {
  const mockCreateOcspRequest = vi.mocked(createOcspRequest);
  const mockSendOCSPRequest = vi.mocked(sendOCSPRequest);

  const ocspRequestData = {
    hashAlgorithm: OCPP2_1.HashAlgorithmEnumType.SHA256,
    issuerNameHash: 'issuer-name-hash',
    issuerKeyHash: 'issuer-key-hash',
    serialNumber: 'serial-0001',
    responderURL: 'https://ocsp.example.com/status',
  };
  const request = { ocspRequestData } as OCPP2_1.GetCertificateStatusRequest;

  beforeEach(() => {
    mockCreateOcspRequest.mockReset();
    mockSendOCSPRequest.mockReset();
  });

  it('sends Accepted with the OCSP responder result', async () => {
    const { handler, ocppSender } = makeSimpleHandler(GetCertificateStatusRequestOcpp2Handler);
    const ocspRequest = { getEncodedHex: () => 'deadbeef' };
    mockCreateOcspRequest.mockReturnValue(ocspRequest as never);
    mockSendOCSPRequest.mockResolvedValue('ocsp-result-base64');
    const message = makeMessage(request, OCPP_CallAction.GetCertificateStatus);

    await handler.handle(message);

    expect(mockCreateOcspRequest).toHaveBeenCalledOnce();
    expect(mockCreateOcspRequest).toHaveBeenCalledWith(ocspRequestData);
    expect(mockSendOCSPRequest).toHaveBeenCalledOnce();
    expect(mockSendOCSPRequest).toHaveBeenCalledWith(
      ocspRequest,
      'https://ocsp.example.com/status',
    );
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);
    expect(sentResponse(ocppSender)).toEqual({
      status: OCPP2_1.GetCertificateStatusEnumType.Accepted,
      ocspResult: 'ocsp-result-base64',
    });
  });

  it('sends Failed with GenericError when the OCSP responder call rejects', async () => {
    const { handler, ocppSender, logger } = makeSimpleHandler(
      GetCertificateStatusRequestOcpp2Handler,
    );
    mockCreateOcspRequest.mockReturnValue({ getEncodedHex: () => 'deadbeef' } as never);
    mockSendOCSPRequest.mockRejectedValue(new Error('responder unreachable'));

    await handler.handle(makeMessage(request, OCPP_CallAction.GetCertificateStatus));

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error.mock.calls[0][0]).toContain('GetCertificateStatus failed');
    expect(sentResponse(ocppSender)).toEqual({
      status: OCPP2_1.GetCertificateStatusEnumType.Failed,
      statusInfo: { reasonCode: ErrorCode.GenericError },
    });
  });

  it('sends Failed without contacting the responder when building the OCSP request throws', async () => {
    const { handler, ocppSender } = makeSimpleHandler(GetCertificateStatusRequestOcpp2Handler);
    mockCreateOcspRequest.mockImplementation(() => {
      throw new Error('bad hash algorithm');
    });

    await handler.handle(makeMessage(request, OCPP_CallAction.GetCertificateStatus));

    expect(mockSendOCSPRequest).not.toHaveBeenCalled();
    expect(sentResponse(ocppSender)).toEqual({
      status: OCPP2_1.GetCertificateStatusEnumType.Failed,
      statusInfo: { reasonCode: ErrorCode.GenericError },
    });
  });
});

describe('VatNumberValidationRequestOcpp21Handler', () => {
  const request = {
    vatNumber: 'DE123456789',
    evseId: 2,
  } as OCPP2_1.VatNumberValidationRequest;

  function makeHandler(viesVatProvider?: Partial<IVatProvider>) {
    const { logger } = createTestContainer();
    const ocppSender = makeMockOcppSender();
    const handler = new VatNumberValidationRequestOcpp21Handler(
      mockDeps<typeof VatNumberValidationRequestOcpp21Handler>({
        logger,
        ocppSender,
        viesVatProvider,
      }),
    );
    return { handler, ocppSender };
  }

  it('sends Accepted with the company the provider resolves', async () => {
    const company = { name: 'ACME GmbH', city: 'Berlin', country: 'DE' };
    const getVat = vi.fn().mockResolvedValue(company);
    const { handler, ocppSender } = makeHandler({ getVat });

    await handler.handle(
      makeMessage(request, OCPP_CallAction.VatNumberValidation, OCPPVersion.OCPP2_1),
    );

    expect(getVat).toHaveBeenCalledOnce();
    expect(getVat).toHaveBeenCalledWith('DE123456789');
    expect(sentResponse(ocppSender)).toEqual({
      vatNumber: 'DE123456789',
      evseId: 2,
      status: OCPP2_1.GenericStatusEnumType.Accepted,
      company,
    });
  });

  it('sends Rejected with a null company when the provider finds nothing', async () => {
    const getVat = vi.fn().mockResolvedValue(null);
    const { handler, ocppSender } = makeHandler({ getVat });

    await handler.handle(
      makeMessage(request, OCPP_CallAction.VatNumberValidation, OCPPVersion.OCPP2_1),
    );

    expect(getVat).toHaveBeenCalledOnce();
    expect(sentResponse(ocppSender)).toEqual({
      vatNumber: 'DE123456789',
      evseId: 2,
      status: OCPP2_1.GenericStatusEnumType.Rejected,
      company: null,
    });
  });

  it('sends Rejected when no VAT provider is configured', async () => {
    const { handler, ocppSender } = makeHandler(undefined);

    await handler.handle(
      makeMessage(request, OCPP_CallAction.VatNumberValidation, OCPPVersion.OCPP2_1),
    );

    expect(sentResponse(ocppSender)).toEqual({
      vatNumber: 'DE123456789',
      evseId: 2,
      status: OCPP2_1.GenericStatusEnumType.Rejected,
      company: null,
    });
  });

  it('propagates a provider failure without sending a response', async () => {
    const getVat = vi.fn().mockRejectedValue(new Error('VIES lookup failed'));
    const { handler, ocppSender } = makeHandler({ getVat });

    await expect(
      handler.handle(
        makeMessage(request, OCPP_CallAction.VatNumberValidation, OCPPVersion.OCPP2_1),
      ),
    ).rejects.toThrow('VIES lookup failed');

    expect(ocppSender.sendCallResultWithMessage).not.toHaveBeenCalled();
  });
});

describe('FirmwareStatusNotificationRequestOcpp2Handler', () => {
  it('acknowledges a firmware status that carries a requestId with an empty confirmation', async () => {
    const { handler, ocppSender } = makeSimpleHandler(
      FirmwareStatusNotificationRequestOcpp2Handler,
    );
    const message = makeMessage(
      {
        status: OCPP2_1.FirmwareStatusEnumType.Downloaded,
        requestId: 42,
      } as OCPP2_1.FirmwareStatusNotificationRequest,
      OCPP_CallAction.FirmwareStatusNotification,
    );

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);
    expect(sentResponse(ocppSender)).toEqual({});
  });

  it('acknowledges a triggered notification without a requestId', async () => {
    const { handler, ocppSender } = makeSimpleHandler(
      FirmwareStatusNotificationRequestOcpp2Handler,
    );

    await handler.handle(
      makeMessage(
        {
          status: OCPP2_1.FirmwareStatusEnumType.Idle,
        } as OCPP2_1.FirmwareStatusNotificationRequest,
        OCPP_CallAction.FirmwareStatusNotification,
      ),
    );

    expect(sentResponse(ocppSender)).toEqual({});
  });
});

describe('LogStatusNotificationRequestOcpp2Handler', () => {
  it('acknowledges an Uploaded log status with an empty confirmation', async () => {
    const { handler, ocppSender } = makeSimpleHandler(LogStatusNotificationRequestOcpp2Handler);
    const message = makeMessage(
      {
        status: OCPP2_1.UploadLogStatusEnumType.Uploaded,
        requestId: 7,
      } as OCPP2_1.LogStatusNotificationRequest,
      OCPP_CallAction.LogStatusNotification,
    );

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);
    expect(sentResponse(ocppSender)).toEqual({});
  });

  it('acknowledges a triggered Idle status without a requestId', async () => {
    const { handler, ocppSender } = makeSimpleHandler(LogStatusNotificationRequestOcpp2Handler);

    await handler.handle(
      makeMessage(
        { status: OCPP2_1.UploadLogStatusEnumType.Idle } as OCPP2_1.LogStatusNotificationRequest,
        OCPP_CallAction.LogStatusNotification,
      ),
    );

    expect(sentResponse(ocppSender)).toEqual({});
  });
});

describe('DataTransferRequestOcpp2Handler', () => {
  it('rejects a vendor request as NotImplemented', async () => {
    const { handler, ocppSender } = makeSimpleHandler(DataTransferRequestOcpp2Handler);
    const message = makeMessage(
      {
        vendorId: 'org.example.vendor',
        messageId: 'CustomAction',
        data: { foo: 'bar' },
      } as OCPP2_1.DataTransferRequest,
      OCPP_CallAction.DataTransfer,
    );

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);
    expect(sentResponse(ocppSender)).toEqual({
      status: DataTransferStatusEnum.Rejected,
      statusInfo: { reasonCode: ErrorCode.NotImplemented },
    });
  });

  it('rejects a minimal request the same way', async () => {
    const { handler, ocppSender } = makeSimpleHandler(DataTransferRequestOcpp2Handler);

    await handler.handle(
      makeMessage(
        { vendorId: 'org.example.vendor' } as OCPP2_1.DataTransferRequest,
        OCPP_CallAction.DataTransfer,
      ),
    );

    expect(sentResponse(ocppSender)).toEqual({
      status: DataTransferStatusEnum.Rejected,
      statusInfo: { reasonCode: ErrorCode.NotImplemented },
    });
  });
});

describe('NotifyChargingLimitRequestOcpp2Handler', () => {
  it('acknowledges the charging limit with an empty confirmation', async () => {
    const { handler, ocppSender } = makeSimpleHandler(NotifyChargingLimitRequestOcpp2Handler);
    const message = makeMessage(
      {
        chargingLimit: { chargingLimitSource: 'EMS' },
        evseId: 1,
      } as OCPP2_1.NotifyChargingLimitRequest,
      OCPP_CallAction.NotifyChargingLimit,
    );

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);
    expect(sentResponse(ocppSender)).toEqual({});
  });
});

describe('HeartbeatRequestOcpp2Handler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('responds with the current system time', async () => {
    const { handler, ocppSender } = makeSimpleHandler(HeartbeatRequestOcpp2Handler);
    const message = makeMessage({} as OCPP2_1.HeartbeatRequest, OCPP_CallAction.Heartbeat);

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);
    expect(sentResponse(ocppSender)).toEqual({ currentTime: '2026-01-15T10:30:00.000Z' });
  });
});

describe('ClearedChargingLimitRequestOcpp2Handler', () => {
  it('acknowledges the cleared limit with an empty confirmation', async () => {
    const { handler, ocppSender } = makeSimpleHandler(ClearedChargingLimitRequestOcpp2Handler);
    const message = makeMessage(
      {
        chargingLimitSource: OCPP2_1.ChargingLimitSourceEnumType.EMS,
        evseId: 1,
      } as OCPP2_1.ClearedChargingLimitRequest,
      OCPP_CallAction.ClearedChargingLimit,
    );

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);
    expect(sentResponse(ocppSender)).toEqual({});
  });
});
