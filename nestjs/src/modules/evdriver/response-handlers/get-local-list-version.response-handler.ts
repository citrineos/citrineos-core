// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { LocalAuthListVersionRepository } from '@repositories/local-auth-list-version.repository';

interface GetLocalListVersionResponse {
  versionNumber: number;
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 / 1.6 `GetLocalListVersion`.
 *
 * Mirrors legacy `validateOrReplaceLocalListVersionForStation`: persists
 * the charger-reported version into `LocalAuthListVersions`. If our
 * recorded version differs, the charger is the source of truth.
 */
@OcppResponseHandler(OCPP_CallAction.GetLocalListVersion, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
  OCPPVersion.OCPP1_6,
])
export class GetLocalListVersionResponseHandler extends CsmsResponseHandler<GetLocalListVersionResponse> {
  constructor(private readonly versions_repo: LocalAuthListVersionRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<GetLocalListVersionResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const { versionNumber } = msg.payload;
    await this.versions_repo.upsertVersion({
      stationId,
      tenantId,
      versionNumber,
    });
    this.logger.debug(`GetLocalListVersion ${stationId}: version=${versionNumber}`);
  }
}
