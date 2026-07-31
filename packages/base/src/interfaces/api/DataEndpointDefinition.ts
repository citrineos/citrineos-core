// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { HttpMethod } from '@citrineos/types';
import { Namespace } from '@ocpp/persistence/namespace.js';
import { OCPP1_6_Namespace, OCPP2_Namespace } from '@ocpp/persistence/index.js';

/**
 * Interface for usage in {@link AsDataEndpoint} decorator.
 */
export interface IDataEndpointDefinition {
  method: (...args: any[]) => any;
  methodName: string;
  namespace: OCPP2_Namespace | OCPP1_6_Namespace | Namespace;
  httpMethod: HttpMethod;
  querySchema?: object;
  bodySchema?: object;
  paramSchema?: object;
  headerSchema?: object;
  responseSchema?: object;
  description?: string;
  tags?: string[];
  summary?: string;
  security?: object[];
}
