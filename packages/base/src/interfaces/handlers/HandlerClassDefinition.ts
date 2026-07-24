// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { CallAction, OCPPVersion } from '@ocpp/rpc/message.js';
import { MessageState } from '@interfaces/messages/index.js';

/**
 * Interface for usage in {@link AsHandlerClass} decorator.
 */
export interface IHandlerClassDefinition {
  protocol: OCPPVersion;
  action: CallAction;
  type: MessageState;
}
