// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { HttpMethod } from '.';
import { Namespace } from '../..';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AsDataEndpoint } from './AsDataEndpoint';

/**
 * Interface for usage in {@link AsDataEndpoint} decorator.
 */
export interface IDataEndpointDefinition {
  method: (...args: any[]) => any;
  methodName: string;
  namespace: Namespace;
  httpMethod: HttpMethod;
  querySchema?: object;
  bodySchema?: object;
}
