// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction } from '../../ocpp/rpc/message.js';
import { OCPPVersion } from '../../ocpp/rpc/message.js';

/**
 * Interface for usage in {@link AsHandler} decorator.
 */
export interface IHandlerDefinition {
  protocol: OCPPVersion;
  action: CallAction;
  method: (...args: any[]) => any;
  methodName: string;
}
