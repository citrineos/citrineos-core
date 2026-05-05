// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';

interface ClearCacheResponse {
  status: 'Accepted' | 'Rejected';
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 / 1.6 `ClearCache`.
 *
 * Mirrors legacy `_handleClearCache` (which is log-only). The CSMS
 * doesn't currently keep its own per-token authorization cache — the
 * authorizer chain reads from `Authorizations` on every request — so
 * there's no in-process state to drop on the response.
 *
 * This handler exists to:
 *   1. Provide a single, named place to wire CSMS-side cache eviction
 *      should we add one in the future (e.g. an LRU of recent
 *      `(idToken, stationId)` decisions).
 *   2. Surface non-Accepted responses as warnings so operators see when
 *      a charger declined the directive.
 */
@OcppResponseHandler(OCPP_CallAction.ClearCache, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
  OCPPVersion.OCPP1_6,
])
export class ClearCacheResponseHandler extends CsmsResponseHandler<ClearCacheResponse> {
  async handle(msg: CsmsResponseMessage<ClearCacheResponse>): Promise<void> {
    const { stationId, correlationId } = msg.context;
    const { status, statusInfo } = msg.payload;

    if (status !== 'Accepted') {
      this.logger.warn(
        `ClearCache ${stationId}/${correlationId} returned status=${status}` +
          (statusInfo?.reasonCode ? ` (${statusInfo.reasonCode})` : ''),
      );
      return;
    }
    this.logger.debug(`ClearCache ${stationId}/${correlationId}: charger acknowledged`);
    // Future: invalidate any CSMS-side authorization cache here. The
    // `AuthorizationService` chain currently reads from DB on every
    // request, so no in-process state needs eviction.
  }
}
