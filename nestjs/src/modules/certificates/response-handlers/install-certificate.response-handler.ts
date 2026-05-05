// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { CertificateAttemptRepository } from '@repositories/certificate-attempt.repository';

interface InstallCertificateResponse {
  status: 'Accepted' | 'Rejected' | 'Failed';
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `InstallCertificate`.
 *
 * Mirrors legacy `_handleInstallCertificate`. Locates the pending
 * InstallCertificateAttempt and stamps it with the charger's reported
 * status. On Accepted, the legacy server then upserts the
 * `InstalledCertificates` row referenced by the attempt's
 * `certificateId`. We delegate that upsert to the helper if needed —
 * for now we just resolve the attempt; the InstalledCertificate row
 * is already created at dispatch time.
 */
@OcppResponseHandler(OCPP_CallAction.InstallCertificate, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class InstallCertificateResponseHandler extends CsmsResponseHandler<InstallCertificateResponse> {
  constructor(private readonly attempts: CertificateAttemptRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<InstallCertificateResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const { status } = msg.payload;

    const attempt = await this.attempts.findPendingInstallAttempt(tenantId, stationId);
    if (!attempt) {
      this.logger.error(
        `InstallCertificate ${stationId}: no pending InstallCertificateAttempt — cannot resolve`,
      );
      return;
    }
    await this.attempts.resolveInstallAttempt(attempt.id, status);
    this.logger.debug(
      `InstallCertificate ${stationId}: certificateId=${attempt.certificateId} status=${status}`,
    );
  }
}
