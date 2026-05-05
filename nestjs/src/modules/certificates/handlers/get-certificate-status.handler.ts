// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { GetCertificateStatusRequest } from '@dto/certificates/get-certificate-status.request';

/**
 * GetCertificateStatus (OCPP 2.0.1 / 2.1).
 *
 * Charger asks the CSMS to OCSP-verify a contract certificate. Mirrors
 * legacy `_handleGetCertificateStatus` shape.
 *
 * Real OCSP forwarding is parity-roadmap §5.x — needs an OCSP client
 * library (legacy uses `jsrsasign`). Until that lands, return
 * `Failed` so the charger sees a structured failure rather than a
 * silent drop. The legacy default fallback is also `Failed` on error.
 */
@OcppHandler(
  OCPP_CallAction.GetCertificateStatus,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  GetCertificateStatusRequest,
)
export class GetCertificateStatusHandler extends OcppRequestHandler<GetCertificateStatusRequest> {
  async handle(msg: OcppMessage<GetCertificateStatusRequest>): Promise<Record<string, unknown>> {
    const { stationId } = msg.context;
    const { ocspRequestData } = msg.payload;
    this.logger.warn(
      `GetCertificateStatus from ${stationId}: OCSP forwarding not yet implemented; ` +
        `returning Failed (responder=${ocspRequestData.responderURL})`,
    );
    return {
      status: 'Failed',
      statusInfo: { reasonCode: 'NotImplemented', additionalInfo: 'OCSP forwarding pending' },
    };
  }
}
