// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IAuthorizer, type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import type { IAuthorizationRepository, IVariableAttributeRepository } from '@citrineos/dal';
import {
  type OcppRequest,
  AuthorizationStatusEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { AuthorizeRequestOcpp201Handler } from '@handlers/index.js';
import type { CertificateAuthorityService } from '@services/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';
import { describe, expect, it, vi } from 'vitest';

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.EVDriver,
    action: OCPP_CallAction.Authorize,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<T>;
}

/**
 * Contract certificate validation runs before the authorization is ever looked up, so a rejected
 * certificate returns without touching the repositories. The authorization is only supplied for
 * the cases where the chain is valid.
 */
function makeHandler(
  certificateAuthorityService: Partial<CertificateAuthorityService>,
  authorization?: object,
) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();

  const handler = new AuthorizeRequestOcpp201Handler({
    logger,
    ocppSender,
    certificateAuthorityService: certificateAuthorityService as CertificateAuthorityService,
    authorizers: [] as IAuthorizer[],
    authorizationRepository: {
      readOnlyOneByQuerystring: vi.fn().mockResolvedValue(authorization),
    } as unknown as IAuthorizationRepository,
    variableAttributeRepository: {
      readAllByQuerystring: vi.fn().mockResolvedValue([]),
    } as unknown as IVariableAttributeRepository,
  } as never);

  return { handler, ocppSender };
}

function sentResponse(
  ocppSender: ReturnType<typeof makeMockOcppSender>,
): OCPP2_0_1.AuthorizeResponse {
  expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
  return ocppSender.sendCallResultWithMessage.mock.calls[0][1] as OCPP2_0_1.AuthorizeResponse;
}

// Not eMAID: validateIdToken enforces the eMAID check digit before the certificate block is
// reached, and the token type is irrelevant to what these tests exercise.
const request: OCPP2_0_1.AuthorizeRequest = {
  idToken: { idToken: 'TAG001', type: OCPP2_0_1.IdTokenEnumType.Central },
};

const A_CONTRACT_CERTIFICATE_CHAIN = '-----BEGIN CERTIFICATE-----abc-----END CERTIFICATE-----';

const hashData = [
  {
    hashAlgorithm: OCPP2_0_1.HashAlgorithmEnumType.SHA256,
    issuerNameHash: 'nameHash',
    issuerKeyHash: 'keyHash',
    serialNumber: 'serial',
    responderURL: 'http://ocsp.example.test',
  },
] as OCPP2_0_1.OCSPRequestDataType[];

describe('AuthorizeRequestOcpp201Handler contract certificate validation', () => {
  it('refuses a contract certificate the OCSP hash data reports revoked', async () => {
    const { handler, ocppSender } = makeHandler({
      validateCertificateHashData: vi
        .fn()
        .mockResolvedValue(OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertificateRevoked),
    } as unknown as Partial<CertificateAuthorityService>);

    await handler.handle(
      makeMessage({ ...request, iso15118CertificateHashData: hashData } as never),
    );

    const response = sentResponse(ocppSender);
    expect(response.certificateStatus).toBe(
      OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertificateRevoked,
    );
    expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Invalid);
  });

  it('validates the chain instead of the responder the station nominated, when both are sent', async () => {
    // validateCertificateChainPem runs OCSP over every certificate in the chain using each one's
    // own AIA responder URL, so the hash data adds nothing here - and its responderURL comes from
    // the station. Running both meant an outbound request to a station-supplied URL whose result
    // was then discarded.
    const validateCertificateHashData = vi.fn();
    const { handler, ocppSender } = makeHandler({
      validateCertificateHashData,
      validateCertificateChainPem: vi
        .fn()
        .mockResolvedValue(OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertChainError),
    } as unknown as Partial<CertificateAuthorityService>);

    await handler.handle(
      makeMessage({
        ...request,
        iso15118CertificateHashData: hashData,
        certificate: A_CONTRACT_CERTIFICATE_CHAIN,
      } as never),
    );

    expect(validateCertificateHashData).not.toHaveBeenCalled();
    const response = sentResponse(ocppSender);
    expect(response.certificateStatus).toBe(
      OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertChainError,
    );
    expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Invalid);
  });

  it('refuses a certificate the chain check reports revoked', async () => {
    const { handler, ocppSender } = makeHandler({
      validateCertificateChainPem: vi
        .fn()
        .mockResolvedValue(OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertificateRevoked),
    } as unknown as Partial<CertificateAuthorityService>);

    await handler.handle(
      makeMessage({ ...request, certificate: A_CONTRACT_CERTIFICATE_CHAIN } as never),
    );

    const response = sentResponse(ocppSender);
    expect(response.certificateStatus).toBe(
      OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertificateRevoked,
    );
    expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Invalid);
  });

  it('refuses a request carrying neither a chain nor any hash data to check', async () => {
    // iso15118CertificateHashData has minItems 1, so an empty list only reaches the handler if
    // something bypassed schema validation. There is nothing to validate, so it fails closed.
    const { handler, ocppSender } = makeHandler({
      validateCertificateHashData: vi.fn(),
      validateCertificateChainPem: vi.fn(),
    } as unknown as Partial<CertificateAuthorityService>);

    await handler.handle(makeMessage({ ...request, iso15118CertificateHashData: [] } as never));

    expect(sentResponse(ocppSender).idTokenInfo.status).toBe(AuthorizationStatusEnum.Invalid);
  });

  it('reports the token expired when the contract certificate has expired', async () => {
    const { handler, ocppSender } = makeHandler({
      validateCertificateChainPem: vi
        .fn()
        .mockResolvedValue(OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertificateExpired),
    } as unknown as Partial<CertificateAuthorityService>);

    await handler.handle(
      makeMessage({ ...request, certificate: A_CONTRACT_CERTIFICATE_CHAIN } as never),
    );

    const response = sentResponse(ocppSender);
    expect(response.certificateStatus).toBe(
      OCPP2_0_1.AuthorizeCertificateStatusEnumType.CertificateExpired,
    );
    expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Expired);
  });

  describe('with a valid contract certificate', () => {
    const validChain = {
      validateCertificateChainPem: vi
        .fn()
        .mockResolvedValue(OCPP2_0_1.AuthorizeCertificateStatusEnumType.Accepted),
    } as unknown as Partial<CertificateAuthorityService>;

    async function authorize(authorization?: object) {
      const { handler, ocppSender } = makeHandler(validChain, authorization);
      await handler.handle(
        makeMessage({ ...request, certificate: A_CONTRACT_CERTIFICATE_CHAIN } as never),
      );
      return sentResponse(ocppSender);
    }

    it('cancels the contract of an eMAID the CSMS does not know', async () => {
      const response = await authorize(undefined);

      expect(response.certificateStatus).toBe(
        OCPP2_0_1.AuthorizeCertificateStatusEnumType.ContractCancelled,
      );
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Unknown);
    });

    it('cancels the contract of a blocked eMAID', async () => {
      const response = await authorize({
        idToken: 'TAG001',
        idTokenType: 'Central',
        status: AuthorizationStatusEnum.Blocked,
      });

      expect(response.certificateStatus).toBe(
        OCPP2_0_1.AuthorizeCertificateStatusEnumType.ContractCancelled,
      );
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Blocked);
    });

    it('cancels the contract of an eMAID whose authorization has lapsed', async () => {
      const response = await authorize({
        idToken: 'TAG001',
        idTokenType: 'Central',
        status: AuthorizationStatusEnum.Accepted,
        cacheExpiryDateTime: '2000-01-01T00:00:00Z',
      });

      expect(response.certificateStatus).toBe(
        OCPP2_0_1.AuthorizeCertificateStatusEnumType.ContractCancelled,
      );
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Invalid);
    });

    it('accepts the contract of an accepted eMAID', async () => {
      const response = await authorize({
        idToken: 'TAG001',
        idTokenType: 'Central',
        status: AuthorizationStatusEnum.Accepted,
      });

      expect(response.certificateStatus).toBe(
        OCPP2_0_1.AuthorizeCertificateStatusEnumType.Accepted,
      );
      expect(response.idTokenInfo.status).toBe(AuthorizationStatusEnum.Accepted);
    });
  });
});
