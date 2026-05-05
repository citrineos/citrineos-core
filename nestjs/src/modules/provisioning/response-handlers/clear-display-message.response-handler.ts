// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { MessageInfoRepository } from '@repositories/message-info.repository';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

interface ClearDisplayMessageResponse {
  status: string; // ClearMessageStatusEnum (Accepted / Unknown)
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for `ClearDisplayMessage` — mirrors legacy
 * `_handleClearDisplayMessage` in `core/src/modules/Configuration/src/module/module.ts`.
 *
 * Same shape as SetDisplayMessage: Accepted invalidates the local
 * MessageInfo cache and re-fetches via GetDisplayMessages so the catalog
 * stays in sync with the charger.
 */
@OcppResponseHandler(OCPP_CallAction.ClearDisplayMessage, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class ClearDisplayMessageResponseHandler extends CsmsResponseHandler<ClearDisplayMessageResponse> {
  constructor(
    private readonly messageInfo: MessageInfoRepository,
    private readonly remoteCalls: RemoteCallsService,
  ) {
    super();
  }

  async handle(msg: CsmsResponseMessage<ClearDisplayMessageResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const status = msg.payload.status;

    this.logger.debug(`ClearDisplayMessage ${stationId}: status=${status}`);

    if (status !== 'Accepted') return;

    await this.messageInfo.deactivateAllByStationId(tenantId, stationId);
    const requestId = Math.floor(Math.random() * 0x7fffffff);
    await this.remoteCalls.sendNoWait(OCPP_CallAction.GetDisplayMessages, stationId, tenantId, {
      requestId,
    });
  }
}
