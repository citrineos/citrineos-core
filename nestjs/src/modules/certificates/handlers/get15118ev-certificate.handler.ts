// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { Get15118EVCertificateRequest } from '@dto/certificates/get-15118-ev-certificate.request';
import { HubjectV2GCAService } from '@certificate-authority/hubject-v2g-ca.service';

/**
 * Get15118EVCertificate (OCPP 2.0.1 / 2.1).
 *
 * Forwards the EXI-encoded ISO 15118 certificate request to Hubject V2G
 * CA and returns the resulting installation data. Until the Hubject HTTP
 * client is implemented (parity roadmap §5.3), the service throws
 * `NotImplementedError`; we catch and return `Failed/NotImplemented` so
 * the charger receives a structured failure rather than a transport error.
 */
@OcppHandler(
  OCPP_CallAction.Get15118EVCertificate,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  Get15118EVCertificateRequest,
)
export class Get15118EVCertificateHandler extends OcppRequestHandler<Get15118EVCertificateRequest> {
  constructor(private readonly v2gCa: HubjectV2GCAService) {
    super();
  }

  async handle(msg: OcppMessage<Get15118EVCertificateRequest>): Promise<Record<string, unknown>> {
    const { stationId } = msg.context;
    const { iso15118SchemaVersion, action, exiRequest } = msg.payload;
    this.logger.debug(
      `Get15118EVCertificate from ${stationId}: schema=${iso15118SchemaVersion}, action=${action}`,
    );

    try {
      const exiResponse = await this.v2gCa.getCertificateInstallationData(
        exiRequest,
        iso15118SchemaVersion,
      );
      return { status: 'Accepted', exiResponse };
    } catch (err) {
      this.logger.warn(`Hubject V2G CA call failed for ${stationId}: ${(err as Error).message}`);
      return {
        status: 'Failed',
        statusInfo: { reasonCode: 'NotImplemented', additionalInfo: (err as Error).message },
      };
    }
  }
}
