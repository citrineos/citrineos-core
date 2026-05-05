// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { CertificateAttemptRepository } from '@repositories/certificate-attempt.repository';

interface DeleteCertificateResponse {
  status: 'Accepted' | 'Failed' | 'NotFound';
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `DeleteCertificate`.
 *
 * Mirrors legacy `_handleDeleteCertificate`:
 *   1. Find the pending DeleteCertificateAttempt for this station.
 *   2. Stamp it with the charger's reported status.
 *   3. On Accepted, remove the matching `InstalledCertificates` rows
 *      (matched by the four hash fields the attempt was keyed on).
 */
@OcppResponseHandler(OCPP_CallAction.DeleteCertificate, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class DeleteCertificateResponseHandler extends CsmsResponseHandler<DeleteCertificateResponse> {
  constructor(private readonly attempts: CertificateAttemptRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<DeleteCertificateResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const { status } = msg.payload;

    const attempt = await this.attempts.findPendingDeleteAttempt(tenantId, stationId);
    if (!attempt) {
      this.logger.error(
        `DeleteCertificate ${stationId}: no pending DeleteCertificateAttempt — cannot resolve`,
      );
      return;
    }

    await this.attempts.resolveDeleteAttempt(attempt.id, status);

    if (status === 'Accepted') {
      const removed = await this.attempts.deleteInstalledMatching(
        tenantId,
        stationId,
        attempt.hashAlgorithm,
        attempt.issuerNameHash,
        attempt.issuerKeyHash,
        attempt.serialNumber,
      );
      this.logger.debug(
        `DeleteCertificate ${stationId}: accepted; removed ${removed} InstalledCertificates row(s)`,
      );
    } else {
      this.logger.debug(`DeleteCertificate ${stationId}: status=${status} — no removal`);
    }
  }
}
