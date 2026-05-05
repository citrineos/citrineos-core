// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { CertificateAttemptRepository } from '@repositories/certificate-attempt.repository';

interface CertificateSignedResponse {
  status: 'Accepted' | 'Rejected';
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `CertificateSigned`
 * (CSMS-initiated — the CSMS pushes a freshly-signed cert chain to the
 * charger). Legacy delegates to
 * `installCertificateHelperService.finalizeInstalledCertificate`
 * which marks the matching `InstallCertificateAttempt` resolved.
 *
 * We mirror that: locate the pending attempt and stamp the status.
 */
@OcppResponseHandler(OCPP_CallAction.CertificateSigned, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class CertificateSignedResponseHandler extends CsmsResponseHandler<CertificateSignedResponse> {
  constructor(private readonly attempts: CertificateAttemptRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<CertificateSignedResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const { status } = msg.payload;
    const attempt = await this.attempts.findPendingInstallAttempt(tenantId, stationId);
    if (!attempt) {
      this.logger.debug(
        `CertificateSigned ${stationId}: no pending InstallCertificateAttempt to resolve (status=${status})`,
      );
      return;
    }
    await this.attempts.resolveInstallAttempt(attempt.id, status);
    this.logger.debug(
      `CertificateSigned ${stationId}: certificateId=${attempt.certificateId} status=${status}`,
    );
  }
}
