// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPVersion } from '@citrineos/types';
import { Service } from 'typedi';
import { OCPP_COMMAND_HANDLER } from './base.js';
import { OCPP2_0_1_CommandHandler } from './OCPP2_0_1_CommandHandler.js';

/**
 * OCPP 2.1 stations take the same three commands as 2.0.1 — the request and
 * response payloads are identical, and 2.1 only widens idToken.type from an
 * enum to a string — so the flow is inherited. What must differ is the route:
 * OcppSender rejects a call whose requested protocol is not the one the
 * station's websocket negotiated, so the command has to be posted to the
 * /ocpp/2.1/ endpoints rather than the 2.0.1 ones.
 */
@Service({ id: OCPP_COMMAND_HANDLER, multiple: true })
export class OCPP2_1_CommandHandler extends OCPP2_0_1_CommandHandler {
  public readonly supportedVersion: OCPPVersion = OCPPVersion.OCPP2_1;

  protected override get commandUrls() {
    return this.config.commands.ocpp2_1;
  }
}
