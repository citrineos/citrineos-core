// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction, OCPPVersion } from '@ocpp/rpc/message.js';

/**
 * Interface for usage in {@link AsMessageEndpoint} decorator.
 */
export interface IMessageEndpointDefinition {
  action: CallAction;
  method: (...args: any[]) => any;
  methodName: string;
  // The schema getter receives the OCPP version the route is being registered for,
  // so a single API instance can resolve version-specific schemas.
  bodySchema: object | ((instance: any, version: OCPPVersion | null) => object);
  optionalQuerystrings?: Record<string, any>;
}
