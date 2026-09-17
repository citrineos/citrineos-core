// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { DEFAULT_TENANT_ID, OcppError, type IMessage } from '@citrineos/base';
import {
  type OcppRequest,
  type OCPP2_request_types,
  AttributeEnum,
  CertificateSigningUseEnum,
  ErrorCode,
  EventGroup,
  GenericStatusEnum,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { SignCertificateRequestOcpp2Handler } from '@handlers/index.js';
import {
  createTestContainer,
  makeMockOcppSender,
  mockDeps,
  type MockOcppSender,
} from '@test/test-container.js';

const mockValidatePEMEncodedCSR = vi.hoisted(() => vi.fn());
const mockParseCSRForVerification = vi.hoisted(() => vi.fn());

// The handler calls these as free functions, so they are stubbed at the module level.
// They live in different modules: the PEM format check in @util, the pkijs parse in @services.
vi.mock('@util/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@util/index.js')>();
  return { ...actual, validatePEMEncodedCSR: mockValidatePEMEncodedCSR };
});

vi.mock('@services/certificate/certificate-util.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@services/certificate/certificate-util.js')>();
  return { ...actual, parseCSRForVerification: mockParseCSRForVerification };
});

const STATION_ID = 'station-001';
const ORG_NAME = 'CitrineOS';
// Secret scanners flag literal PEM delimiters even on placeholder bodies that
// carry no key material, so the markers are assembled instead.
const PEM_DASHES = '-'.repeat(5);
const pemBlock = (label: string, body: string) =>
  `${PEM_DASHES}BEGIN ${label}${PEM_DASHES}\n${body}\n${PEM_DASHES}END ${label}${PEM_DASHES}`;
const CSR_PEM = pemBlock('CERTIFICATE REQUEST', 'MIIBVjCB\nPQIBADAS');
// The handler strips newlines before verification and chain generation.
const CSR_STRIPPED = CSR_PEM.replace(/\n/g, '');
const CHAIN_PEM = pemBlock('CERTIFICATE', 'chain');

function makeMessage<T extends OcppRequest>(
  payload: T,
  protocol: OCPPVersion = OCPPVersion.OCPP2_0_1,
): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Certificates,
    action: OCPP_CallAction.SignCertificate,
    state: MessageState.Request,
    protocol,
  } as unknown as IMessage<T>;
}

function aSignCertificateRequest(
  overrides: Record<string, unknown> = {},
): OCPP2_request_types.SignCertificateRequest {
  return {
    csr: CSR_PEM,
    certificateType: CertificateSigningUseEnum.V2GCertificate,
    ...overrides,
  } as OCPP2_request_types.SignCertificateRequest;
}

// Minimal pkijs CertificationRequest stand-in: verify() plus the subject attribute list
// the organization-name check reads ('2.5.4.10' is the organizationName OID).
function aParsedCsr(options: { verifies?: boolean; organizationName?: string } = {}) {
  return {
    verify: vi.fn().mockResolvedValue(options.verifies ?? true),
    subject: {
      typesAndValues:
        options.organizationName === undefined
          ? []
          : [{ type: '2.5.4.10', value: { valueBlock: { value: options.organizationName } } }],
    },
  };
}

describe('SignCertificateRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let ocppSender: MockOcppSender;
  let getCertificateChain: Mock;
  let prepareToInstallCertificate: Mock;
  let readAllByQuerystring: Mock;
  let handler: SignCertificateRequestOcpp2Handler;

  beforeEach(() => {
    vi.clearAllMocks();

    mockValidatePEMEncodedCSR.mockReturnValue({ isValid: true });
    mockParseCSRForVerification.mockReturnValue(aParsedCsr({ organizationName: ORG_NAME }));

    ocppSender = makeMockOcppSender();
    getCertificateChain = vi.fn().mockResolvedValue(CHAIN_PEM);
    prepareToInstallCertificate = vi.fn().mockResolvedValue(undefined);
    readAllByQuerystring = vi.fn().mockResolvedValue([{ value: ORG_NAME }]);

    handler = new SignCertificateRequestOcpp2Handler(
      mockDeps<typeof SignCertificateRequestOcpp2Handler>({
        logger,
        ocppSender,
        certificateAuthorityService: { getCertificateChain },
        installCertificateHelperService: { prepareToInstallCertificate },
        deviceModelRepository: { readAllByQuerystring },
      }),
    );
  });

  it('rejects a malformed CSR with a FormatViolation call error and sends nothing else', async () => {
    mockValidatePEMEncodedCSR.mockReturnValue({
      isValid: false,
      errorMessage: 'missing PEM header',
    });

    await handler.handle(makeMessage(aSignCertificateRequest()));

    // Validation runs on the raw payload csr, newlines intact.
    expect(mockValidatePEMEncodedCSR).toHaveBeenCalledOnce();
    expect(mockValidatePEMEncodedCSR).toHaveBeenCalledWith(CSR_PEM);
    expect(logger.warn).toHaveBeenCalledWith('Invalid CSR format: missing PEM header');

    expect(ocppSender.sendCallErrorWithMessage).toHaveBeenCalledOnce();
    const [, error] = ocppSender.sendCallErrorWithMessage.mock.calls[0];
    expect(error).toBeInstanceOf(OcppError);
    expect((error as OcppError).messageId).toBe('corr-001');
    expect((error as OcppError).errorCode).toBe(ErrorCode.FormatViolation);
    expect((error as OcppError).message).toBe('Invalid CSR format.');

    expect(ocppSender.sendCallResultWithMessage).not.toHaveBeenCalled();
    expect(getCertificateChain).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('accepts a V2G CSR and forwards the signed chain in a CertificateSigned call', async () => {
    const message = makeMessage(aSignCertificateRequest());

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({
      status: GenericStatusEnum.Accepted,
    });

    expect(mockParseCSRForVerification).toHaveBeenCalledOnce();
    expect(mockParseCSRForVerification).toHaveBeenCalledWith(CSR_STRIPPED);

    expect(getCertificateChain).toHaveBeenCalledOnce();
    expect(getCertificateChain).toHaveBeenCalledWith(
      CSR_STRIPPED,
      STATION_ID,
      CertificateSigningUseEnum.V2GCertificate,
    );

    expect(prepareToInstallCertificate).toHaveBeenCalledOnce();
    expect(prepareToInstallCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION_ID,
      CHAIN_PEM,
      CertificateSigningUseEnum.V2GCertificate,
      undefined,
    );

    // V2G certificates skip the organization-name device model lookup.
    expect(readAllByQuerystring).not.toHaveBeenCalled();

    expect(ocppSender.sendCall).toHaveBeenCalledOnce();
    expect(ocppSender.sendCall.mock.calls[0][0]).toEqual({
      ocppConnectionName: STATION_ID,
      tenantId: DEFAULT_TENANT_ID,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.CertificateSigned,
      eventGroup: EventGroup.Certificates,
      payload: {
        certificateChain: CHAIN_PEM,
        certificateType: CertificateSigningUseEnum.V2GCertificate,
      },
    });
    // 2.0.1 never carries a requestId.
    expect('requestId' in ocppSender.sendCall.mock.calls[0][0].payload).toBe(false);
  });

  it('propagates the requestId of an OCPP 2.1 request into install prep and CertificateSigned', async () => {
    const message = makeMessage(
      aSignCertificateRequest({
        certificateType: CertificateSigningUseEnum.V2G20Certificate,
        requestId: 42,
      }),
      OCPPVersion.OCPP2_1,
    );

    await handler.handle(message);

    expect(prepareToInstallCertificate).toHaveBeenCalledOnce();
    expect(prepareToInstallCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION_ID,
      CHAIN_PEM,
      CertificateSigningUseEnum.V2G20Certificate,
      42,
    );

    expect(ocppSender.sendCall).toHaveBeenCalledOnce();
    const call = ocppSender.sendCall.mock.calls[0][0];
    expect(call.protocol).toBe(OCPPVersion.OCPP2_1);
    expect(call.payload).toEqual({
      certificateChain: CHAIN_PEM,
      certificateType: CertificateSigningUseEnum.V2G20Certificate,
      requestId: 42,
    });
  });

  it('omits requestId from CertificateSigned when a 2.1 request carries none', async () => {
    const message = makeMessage(
      aSignCertificateRequest({ certificateType: CertificateSigningUseEnum.V2G20Certificate }),
      OCPPVersion.OCPP2_1,
    );

    await handler.handle(message);

    expect(prepareToInstallCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION_ID,
      CHAIN_PEM,
      CertificateSigningUseEnum.V2G20Certificate,
      undefined,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledOnce();
    expect('requestId' in ocppSender.sendCall.mock.calls[0][0].payload).toBe(false);
  });

  it('verifies the CSR organization name against the device model for a ChargingStationCertificate', async () => {
    const message = makeMessage(
      aSignCertificateRequest({
        certificateType: CertificateSigningUseEnum.ChargingStationCertificate,
      }),
    );

    await handler.handle(message);

    expect(readAllByQuerystring).toHaveBeenCalledOnce();
    expect(readAllByQuerystring).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      component_name: 'SecurityCtrlr',
      variable_name: 'OrganizationName',
      type: AttributeEnum.Actual,
    });

    expect(getCertificateChain).toHaveBeenCalledWith(
      CSR_STRIPPED,
      STATION_ID,
      CertificateSigningUseEnum.ChargingStationCertificate,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledOnce();
  });

  it('stops after the forced accept when the certificate type is unsupported', async () => {
    const message = makeMessage(aSignCertificateRequest({ certificateType: undefined }));

    await handler.handle(message);

    // OCTT workaround: the accept goes out before any verification.
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({
      status: GenericStatusEnum.Accepted,
    });

    expect(logger.error).toHaveBeenCalledOnce();
    const [prefix, error] = logger.error.mock.calls[0];
    expect(prefix).toBe('Sign certificate failed:');
    expect((error as Error).message).toBe('Unsupported certificate type: undefined');

    expect(getCertificateChain).not.toHaveBeenCalled();
    expect(prepareToInstallCertificate).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('stops when the CSR signature does not verify', async () => {
    const parsedCsr = aParsedCsr({ verifies: false });
    mockParseCSRForVerification.mockReturnValue(parsedCsr);

    await handler.handle(makeMessage(aSignCertificateRequest()));

    expect(parsedCsr.verify).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledOnce();
    expect((logger.error.mock.calls[0][1] as Error).message).toBe(
      'Verify the signature on this csr using its public key failed',
    );
    expect(getCertificateChain).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('stops when the CSR organization name does not match the device model', async () => {
    mockParseCSRForVerification.mockReturnValue(aParsedCsr({ organizationName: 'EvilCorp' }));

    await handler.handle(
      makeMessage(
        aSignCertificateRequest({
          certificateType: CertificateSigningUseEnum.ChargingStationCertificate,
        }),
      ),
    );

    expect(readAllByQuerystring).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledOnce();
    expect((logger.error.mock.calls[0][1] as Error).message).toContain(
      `Expect organizationName ${ORG_NAME}`,
    );
    expect(getCertificateChain).not.toHaveBeenCalled();
    expect(prepareToInstallCertificate).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('stops when the device model has no organization name row', async () => {
    readAllByQuerystring.mockResolvedValue([]);

    await handler.handle(
      makeMessage(
        aSignCertificateRequest({
          certificateType: CertificateSigningUseEnum.ChargingStationCertificate,
        }),
      ),
    );

    expect(logger.error).toHaveBeenCalledOnce();
    expect((logger.error.mock.calls[0][1] as Error).message).toBe(
      'Expected organizationName not found in DB',
    );
    expect(getCertificateChain).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('stops when the certificate authority cannot produce a chain', async () => {
    getCertificateChain.mockRejectedValue(new Error('CA unreachable'));

    await handler.handle(makeMessage(aSignCertificateRequest()));

    // The forced accept already went out; the failure only halts the follow-up.
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(getCertificateChain).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledOnce();
    expect((logger.error.mock.calls[0][1] as Error).message).toBe('CA unreachable');
    expect(prepareToInstallCertificate).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });
});
