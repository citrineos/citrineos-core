// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { OCPP_CallAction } from '@ocpp/call-action';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

export type CertificateSigningUseLike = 'ChargingStationCertificate' | 'V2GCertificate';

/**
 * Sends a CSMS-initiated `CertificateSigned` CALL to a charger after a CA
 * (Hubject V2G or ACME) returns a freshly-signed cert. Mirrors the legacy
 * `_sendCertificateSigned` path triggered by `SignCertificate` round-trips.
 *
 * Caller pattern (after the CA call succeeds):
 *
 *   try {
 *     const signedCert = await acmeCa.signCertificate(csr);
 *     await dispatcher.dispatch({
 *       stationId, tenantId, certificateChain: signedCert,
 *       certificateType: 'ChargingStationCertificate',
 *     });
 *   } catch (err) {
 *     // structured failure — caller decides how to surface
 *   }
 *
 * Best-effort: failures here log+swallow so a downstream blip doesn't
 * tear down the cert flow.
 */
@Injectable()
export class CertificateSignedDispatcher {
  private readonly logger = new Logger(CertificateSignedDispatcher.name);

  constructor(private readonly remoteCalls: RemoteCallsService) {}

  async dispatch(args: {
    stationId: string;
    tenantId: number;
    certificateChain: string;
    certificateType: CertificateSigningUseLike;
  }): Promise<void> {
    try {
      await this.remoteCalls.sendAndAwait(
        OCPP_CallAction.CertificateSigned,
        args.stationId,
        args.tenantId,
        {
          certificateChain: args.certificateChain,
          certificateType: args.certificateType,
        },
        30,
      );
      this.logger.debug(
        `CertificateSigned delivered to ${args.stationId} (${args.certificateType})`,
      );
    } catch (err) {
      this.logger.warn(`CertificateSigned to ${args.stationId} failed: ${(err as Error).message}`);
    }
  }
}
