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
import { Authorize16Request } from '@dto/evdriver/authorize-16.request';
import { AuthorizationService } from '@modules/evdriver/services/authorization.service';

/**
 * OCPP 1.6 Authorize handler.
 *
 * Pure protocol layer — defers all business logic to AuthorizationService.
 */
@OcppHandler(OCPP_CallAction.Authorize, [OCPPVersion.OCPP1_6], Authorize16Request)
export class Authorize16Handler extends OcppRequestHandler<Authorize16Request> {
  constructor(private readonly authorizationService: AuthorizationService) {
    super();
  }

  async handle(msg: OcppMessage<Authorize16Request>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { idTag } = msg.payload;

    this.logger.debug(`Authorize (1.6) from ${stationId}: idTag=${idTag}`);

    const idTagInfo = await this.authorizationService.authorize16(tenantId, idTag, { stationId });
    await msg.respond({ idTagInfo });

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }
}
