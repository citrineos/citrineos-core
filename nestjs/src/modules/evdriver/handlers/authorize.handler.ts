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
import { AuthorizeRequest } from '@dto/evdriver/authorize.request';
import { AuthorizationStatusEnumType } from '@enums/authorization-status.enum';
import { IdTokenEnumType } from '@enums/id-token.enum';
import { AuthorizationService } from '@modules/evdriver/services/authorization.service';
import { validateIdTokenFormat } from '@modules/evdriver/services/id-token-validator';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * Authorize (OCPP 2.0.1 / 2.1).
 *
 * Mirrors legacy `_handleAuthorize`:
 *   1. Validate idToken format per declared type (ISO14443/ISO15693/...).
 *      Format-invalid → respond `status=Invalid` without DB hit.
 *   2. NoAuthorization shortcut → auto-Accept.
 *   3. Otherwise route through the authorizer chain
 *      (Database → EvseRestriction → RealTime).
 *
 * Contract-cert validation (iso15118CertificateHashData / `certificate`)
 * is deferred — legacy itself has TODOs around the OCSP cache flow
 * described in OCPP 2.0.1 Part 2 C07.FR.05/06.
 */
@OcppHandler(
  OCPP_CallAction.Authorize,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  AuthorizeRequest,
)
export class AuthorizeHandler extends OcppRequestHandler<AuthorizeRequest> {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<AuthorizeRequest>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { idToken } = msg.payload;

    this.logger.debug(
      `Authorize from ${stationId}: token=${idToken.idToken}, type=${idToken.type}`,
    );

    // 1) Token format gate.
    const formatCheck = validateIdTokenFormat(idToken.type, idToken.idToken);
    if (!formatCheck.isValid) {
      this.logger.warn(
        `Authorize ${stationId}: invalid token format (${idToken.type}): ${formatCheck.errorMessage}`,
      );
      const idTokenInfo = { status: AuthorizationStatusEnumType.Invalid };
      await msg.respond({ idTokenInfo });
      this.webhooks.emit(WebhookEvent.Authorize, { idToken, idTokenInfo }, { stationId, tenantId });
      return { [HANDLER_HANDLED_RESPONSE]: true };
    }

    // 2) NoAuthorization shortcut — auto-Accept (charger is gating elsewhere).
    if (idToken.type === IdTokenEnumType.NoAuthorization) {
      const idTokenInfo = { status: AuthorizationStatusEnumType.Accepted };
      await msg.respond({ idTokenInfo });
      this.webhooks.emit(WebhookEvent.Authorize, { idToken, idTokenInfo }, { stationId, tenantId });
      return { [HANDLER_HANDLED_RESPONSE]: true };
    }

    // 3) Authorization chain (DB → EvseRestriction → RealTime).
    const idTokenInfo = await this.authorizationService.authorize(tenantId, idToken, { stationId });
    await msg.respond({ idTokenInfo });

    this.webhooks.emit(WebhookEvent.Authorize, { idToken, idTokenInfo }, { stationId, tenantId });

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }
}
