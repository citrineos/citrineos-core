// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  EventGroup,
  GetCertificateStatusEnum,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { GetCertificateStatusRequestOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

const RESPONDER_URL = 'http://ocsp.example.test/responder';

/**
 * A short stand-in for the DER an OCSP responder returns. The handler is not expected to parse it,
 * only to carry it through to the station, so any byte string that is not valid UTF-8 will do -
 * 0x80 through 0x83 are continuation bytes with no lead byte, so a text decode mangles them.
 */
const RESPONDER_DER = Uint8Array.from([0x30, 0x03, 0x0a, 0x01, 0x00, 0x80, 0x81, 0x82, 0x83]);

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
    eventGroup: EventGroup.Certificates,
    action: OCPP_CallAction.GetCertificateStatus,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_1,
  } as unknown as IMessage<T>;
}

function aGetCertificateStatusRequest(): OCPP2_1.GetCertificateStatusRequest {
  return {
    ocspRequestData: {
      hashAlgorithm: OCPP2_1.HashAlgorithmEnumType.SHA256,
      issuerNameHash: 'aa'.repeat(32),
      issuerKeyHash: 'bb'.repeat(32),
      serialNumber: '0102030405',
      responderURL: RESPONDER_URL,
    },
  };
}

describe('GetCertificateStatusRequestOcpp2Handler', () => {
  let handler: GetCertificateStatusRequestOcpp2Handler;
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const { logger } = createTestContainer();
    ocppSender = makeMockOcppSender();
    handler = new GetCertificateStatusRequestOcpp2Handler({ logger, ocppSender });

    fetchMock = vi.fn().mockResolvedValue(
      new Response(RESPONDER_DER, {
        status: 200,
        headers: { 'Content-Type': 'application/ocsp-response' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function handleAndGetResponse(): Promise<OCPP2_1.GetCertificateStatusResponse> {
    await handler.handle(makeMessage(aGetCertificateStatusRequest()));
    return ocppSender.sendCallResultWithMessage.mock
      .calls[0][1] as OCPP2_1.GetCertificateStatusResponse;
  }

  // M06.FR.02: the CSMS indicates success by setting status to Accepted.
  it('reaches the responder and reports Accepted', async () => {
    const response = await handleAndGetResponse();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(GetCertificateStatusEnum.Accepted);
  });

  // M06.FR.08 / M06.FR.09: the request body is the DER of an RFC 6960 OCSPRequest.
  it('posts the DER of an OCSPRequest, not its hex text', async () => {
    await handleAndGetResponse();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(RESPONDER_URL);
    expect(init.body).toBeInstanceOf(Uint8Array);

    const der = Buffer.from(init.body as Uint8Array);
    // 0x30 is the SEQUENCE tag every DER OCSPRequest starts with.
    expect(der[0]).toBe(0x30);

    const { KJUR } = await import('jsrsasign');
    const parsed = new KJUR.asn1.ocsp.OCSPParser().getOCSPRequest(der.toString('hex'));
    expect(parsed.array).toEqual([
      {
        alg: 'sha256',
        issname: 'aa'.repeat(32),
        isskey: 'bb'.repeat(32),
        sbjsn: '0102030405',
      },
    ]);
  });

  // M06.FR.03: the OCSP response data goes back in ocspResult, base64 of the DER.
  it('returns the responder DER in ocspResult, base64 encoded', async () => {
    const response = await handleAndGetResponse();

    expect(response.ocspResult).toBe(Buffer.from(RESPONDER_DER).toString('base64'));
  });

  // M06.FR.04: the CSMS says Failed when it could not retrieve the status.
  it('reports Failed when the responder refuses', async () => {
    fetchMock.mockResolvedValue(new Response('no', { status: 500 }));

    const response = await handleAndGetResponse();

    expect(response.status).toBe(GetCertificateStatusEnum.Failed);
    expect(response.ocspResult).toBeUndefined();
  });
});
