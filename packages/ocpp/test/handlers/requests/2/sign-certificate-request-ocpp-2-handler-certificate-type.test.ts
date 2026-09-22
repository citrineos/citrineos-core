// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import type { IVariableAttributeRepository } from '@citrineos/dal';
import {
  type OcppRequest,
  CertificateSigningUseEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { SignCertificateRequestOcpp2Handler } from '@handlers/index.js';
import type { CertificateAuthorityService } from '@services/index.js';
import type { InstallCertificateHelperService } from '@services/certificate/install-certificate-helper-service.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';
import { readFile } from '../../../utils/file-util.js';
import { describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';
const SIGNED_CHAIN = '-----BEGIN CERTIFICATE-----signed-----END CERTIFICATE-----';

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Certificates,
    action: OCPP_CallAction.SignCertificate,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<T>;
}

function makeHandler() {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();
  const certificateAuthorityService = {
    getCertificateChain: vi.fn().mockResolvedValue(SIGNED_CHAIN),
  };
  const installCertificateHelperService = {
    prepareToInstallCertificate: vi.fn().mockResolvedValue(undefined),
  };

  const handler = new SignCertificateRequestOcpp2Handler({
    logger,
    ocppSender,
    certificateAuthorityService:
      certificateAuthorityService as unknown as CertificateAuthorityService,
    installCertificateHelperService:
      installCertificateHelperService as unknown as InstallCertificateHelperService,
    variableAttributeRepository: {
      readAllByQuerystring: vi.fn().mockResolvedValue([{ value: 'Pionix' }]),
    } as unknown as IVariableAttributeRepository,
  } as never);

  return { handler, ocppSender, certificateAuthorityService, installCertificateHelperService };
}

function certificateSignedRequestsSent(ocppSender: ReturnType<typeof makeMockOcppSender>) {
  return ocppSender.sendCall.mock.calls
    .map(([call]) => call)
    .filter((call) => call.action === OCPP_CallAction.CertificateSigned);
}

describe('SignCertificateRequestOcpp2Handler', () => {
  const csr = readFile('ChargingStationCSRSample.pem');

  it('signs a ChargingStationCertificate CSR and echoes its type', async () => {
    const { handler, ocppSender } = makeHandler();

    await handler.handle(
      makeMessage({
        csr,
        certificateType: OCPP2_0_1.CertificateSigningUseEnumType.ChargingStationCertificate,
      } as OCPP2_0_1.SignCertificateRequest),
    );

    const sent = certificateSignedRequestsSent(ocppSender);
    expect(sent).toHaveLength(1);
    expect(sent[0].payload).toEqual({
      certificateChain: SIGNED_CHAIN,
      certificateType: OCPP2_0_1.CertificateSigningUseEnumType.ChargingStationCertificate,
    });
  });

  it('signs a CSR sent without certificateType, for both connections', async () => {
    const { handler, ocppSender, certificateAuthorityService, installCertificateHelperService } =
      makeHandler();

    await handler.handle(makeMessage({ csr } as OCPP2_0_1.SignCertificateRequest));

    const sent = certificateSignedRequestsSent(ocppSender);
    expect(sent).toHaveLength(1);
    expect(sent[0].payload.certificateChain).toBe(SIGNED_CHAIN);
    expect(sent[0].payload.certificateType).toBeUndefined();
    expect(certificateAuthorityService.getCertificateChain).toHaveBeenCalledWith(
      expect.any(String),
      STATION,
      CertificateSigningUseEnum.ChargingStationCertificate,
    );
    expect(installCertificateHelperService.prepareToInstallCertificate).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      SIGNED_CHAIN,
      CertificateSigningUseEnum.ChargingStationCertificate,
      undefined,
    );
  });
});
