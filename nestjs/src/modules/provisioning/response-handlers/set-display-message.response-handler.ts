// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { MessageInfoRepository } from '@repositories/message-info.repository';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

interface SetDisplayMessageResponse {
  status: string; // DisplayMessageStatusEnum (Accepted / Rejected / NotSupported* / UnknownTransaction / etc.)
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for `SetDisplayMessage` — mirrors legacy
 * `_handleSetDisplayMessage` in `core/src/modules/Configuration/src/module/module.ts`.
 *
 * On Accepted: deactivate all locally-tracked MessageInfos for the station
 * and dispatch a fresh `GetDisplayMessages` CALL so NotifyDisplayMessages
 * re-populates the catalog. Other statuses are pass-through (logged at
 * debug — the caller already received the status via the REST awaiter).
 */
@OcppResponseHandler(OCPP_CallAction.SetDisplayMessage, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class SetDisplayMessageResponseHandler extends CsmsResponseHandler<SetDisplayMessageResponse> {
  constructor(
    private readonly messageInfo: MessageInfoRepository,
    private readonly remoteCalls: RemoteCallsService,
  ) {
    super();
  }

  async handle(msg: CsmsResponseMessage<SetDisplayMessageResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const status = msg.payload.status;

    this.logger.debug(`SetDisplayMessage ${stationId}: status=${status}`);

    if (status !== 'Accepted') return;

    await this.messageInfo.deactivateAllByStationId(tenantId, stationId);
    // Mint a fresh requestId — legacy uses a per-station sequence
    // (`ChargingStationSequenceTypeEnum.getDisplayMessages`) but our
    // NotifyDisplayMessages handler validates against any prior
    // GetDisplayMessages CALL, so a UUID-derived integer is sufficient
    // here. A real per-station sequence is owed when we port
    // `ChargingStationSequence` (F2 Phase C drift).
    const requestId = Math.floor(Math.random() * 0x7fffffff);
    await this.remoteCalls.sendNoWait(OCPP_CallAction.GetDisplayMessages, stationId, tenantId, {
      requestId,
    });
  }
}
