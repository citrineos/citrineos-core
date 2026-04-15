// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction } from '../../ocpp/rpc/message.js';

/**
 * Interface for usage in {@link AsMessageEndpoint} decorator.
 */
export interface IMessageEndpointDefinition {
  action: CallAction;
  method: (...args: any[]) => any;
  methodName: string;
  bodySchema: object;
  optionalQuerystrings?: Record<string, any>;
}
