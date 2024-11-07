// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CallAction } from '../../ocpp/rpc/message';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AsMessageEndpoint } from './AsMessageEndpoint';

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
