// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
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
import { parseOcspRequestHex } from '../../../utils/ocsp-request-parser.js';

const sendToPublicOcspResponder = vi.hoisted(() => vi.fn());
vi.mock('@/services/certificate/ocsp-responder-url.js', () => ({ sendToPublicOcspResponder }));

const RESPONDER_URL = 'http://ocsp.example.test/responder';

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

  beforeEach(() => {
    const { logger } = createTestContainer();
    ocppSender = makeMockOcppSender();
    handler = new GetCertificateStatusRequestOcpp2Handler({ logger, ocppSender });

    sendToPublicOcspResponder
      .mockReset()
      .mockResolvedValue({ status: 200, body: Buffer.from(RESPONDER_DER) });
  });

  async function handleAndGetResponse(): Promise<OCPP2_1.GetCertificateStatusResponse> {
    await handler.handle(makeMessage(aGetCertificateStatusRequest()));
    return ocppSender.sendCallResultWithMessage.mock
      .calls[0][1] as OCPP2_1.GetCertificateStatusResponse;
  }

  it('reaches the responder and reports Accepted', async () => {
    const response = await handleAndGetResponse();

    expect(sendToPublicOcspResponder).toHaveBeenCalledOnce();
    expect(response.status).toBe(GetCertificateStatusEnum.Accepted);
  });

  it('posts the DER of an OCSPRequest, not its hex text', async () => {
    await handleAndGetResponse();

    const [url, body] = sendToPublicOcspResponder.mock.calls[0] as [string, Uint8Array];
    expect(url).toBe(RESPONDER_URL);
    expect(body).toBeInstanceOf(Uint8Array);

    const der = Buffer.from(body);
    expect(der[0]).toBe(0x30);

    expect(parseOcspRequestHex(der.toString('hex'))).toEqual([
      {
        alg: 'sha256',
        issname: 'aa'.repeat(32),
        isskey: 'bb'.repeat(32),
        sbjsn: '0102030405',
      },
    ]);
  });

  it('returns the responder DER in ocspResult, base64 encoded', async () => {
    const response = await handleAndGetResponse();

    expect(response.ocspResult).toBe(Buffer.from(RESPONDER_DER).toString('base64'));
  });

  it('reports Failed when the responder refuses', async () => {
    sendToPublicOcspResponder.mockResolvedValue({ status: 500, body: Buffer.from('no') });

    const response = await handleAndGetResponse();

    expect(response.status).toBe(GetCertificateStatusEnum.Failed);
    expect(response.ocspResult).toBeUndefined();
  });
});
