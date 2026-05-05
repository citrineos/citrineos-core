// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { LocalAuthListVersionRepository } from '@repositories/local-auth-list-version.repository';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

interface SendLocalListResponse {
  status: 'Accepted' | 'Failed' | 'VersionMismatch';
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

type SendLocalListRequest = {
  versionNumber: number;
  updateType: 'Differential' | 'Full';
  localAuthorizationList?: Array<Record<string, unknown>>;
} & Record<string, unknown>;

/**
 * Response handler for OCPP 2.0.1 / 2.1 / 1.6 `SendLocalList`.
 *
 * Mirrors legacy `_handleSendLocalList`. On `Accepted`, persists the
 * version+payload as the new authoritative local list snapshot for the
 * station. Other statuses log a warning — operator must reconcile.
 */
@OcppResponseHandler(OCPP_CallAction.SendLocalList, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
  OCPPVersion.OCPP1_6,
])
export class SendLocalListResponseHandler extends CsmsResponseHandler<SendLocalListResponse> {
  constructor(
    private readonly versions_repo: LocalAuthListVersionRepository,
    private readonly remoteCalls: RemoteCallsService,
  ) {
    super();
  }

  async handle(msg: CsmsResponseMessage<SendLocalListResponse>): Promise<void> {
    const { stationId, tenantId, correlationId } = msg.context;
    const { status } = msg.payload;

    if (status !== 'Accepted') {
      this.logger.warn(
        `SendLocalList ${stationId}/${correlationId} returned status=${status} — version not advanced`,
      );
      return;
    }

    const original = await this.remoteCalls.getOriginatingRequest<SendLocalListRequest>(
      correlationId,
      stationId,
    );
    if (!original) {
      this.logger.error(
        `SendLocalList ${stationId}/${correlationId}: originating request missing from cache; cannot persist new version`,
      );
      return;
    }

    await this.versions_repo.upsertVersion({
      stationId,
      tenantId,
      versionNumber: original.payload.versionNumber,
    });
    this.logger.debug(
      `SendLocalList ${stationId} accepted: version=${original.payload.versionNumber} (${original.payload.updateType})`,
    );
  }
}
