// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import {
  HANDLER_HANDLED_RESPONSE,
  type HandlerHandledResponse,
  OcppMessage,
  OcppRequestHandler,
} from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { CertificateSigningUseEnumType } from '@enums/sign-certificate-use.enum';
import { SignCertificateRequest } from '@dto/certificates/sign-certificate.request';
import { AcmeChargingStationCAService } from '@certificate-authority/acme-charging-station-ca.service';
import { CertificateSignedDispatcher } from '@certificate-authority/certificate-signed-dispatcher.service';
import { HubjectV2GCAService } from '@certificate-authority/hubject-v2g-ca.service';

/**
 * SignCertificate (OCPP 2.0.1 / 2.1).
 *
 * Acks the charger immediately with `Accepted`, then runs the CA
 * signing flow + delivers the signed cert via a CSMS-initiated
 * `CertificateSigned` CALL — both as background work so the charger's
 * SignCertificate response isn't blocked on the CA round-trip.
 *
 * Routes the CSR to the right CA based on `certificateType`:
 *   - `ChargingStationCertificate` (default) → ACME for station TLS.
 *   - `V2GCertificate` → Hubject V2G CA for ISO 15118 contract certs.
 *
 * If the CA throws (not configured, transport error, JWS flow not yet
 * implemented), the dispatcher path simply isn't taken; the charger
 * has already received its `Accepted` ack and the failure is logged.
 */
@OcppHandler(
  OCPP_CallAction.SignCertificate,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  SignCertificateRequest,
)
export class SignCertificateHandler extends OcppRequestHandler<SignCertificateRequest> {
  constructor(
    private readonly acmeCa: AcmeChargingStationCAService,
    private readonly v2gCa: HubjectV2GCAService,
    private readonly certificateSignedDispatcher: CertificateSignedDispatcher,
  ) {
    super();
  }

  async handle(msg: OcppMessage<SignCertificateRequest>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { csr, certificateType } = msg.payload;
    const usage = certificateType ?? CertificateSigningUseEnumType.ChargingStationCertificate;
    this.logger.debug(`SignCertificate from ${stationId}: certificateType=${usage}`);

    // Ack now; sign + deliver in the background.
    await msg.respond({ status: 'Accepted' });

    void this.signAndDispatch(stationId, tenantId, csr, usage).catch((err) =>
      this.logger.warn(
        `SignCertificate background flow failed for ${stationId}: ${(err as Error).message}`,
      ),
    );

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }

  private async signAndDispatch(
    stationId: string,
    tenantId: number,
    csr: string,
    usage: CertificateSigningUseEnumType,
  ): Promise<void> {
    const certificateChain =
      usage === CertificateSigningUseEnumType.V2GCertificate
        ? await this.v2gCa.signCertificateRequest(csr)
        : await this.acmeCa.signCertificate(csr);

    await this.certificateSignedDispatcher.dispatch({
      stationId,
      tenantId,
      certificateChain,
      certificateType: usage,
    });
  }
}
