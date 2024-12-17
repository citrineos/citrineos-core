// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { CallAction, OCPPVersion } from '../../ocpp/rpc/message';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AsHandler } from '.';

/**
 * Interface for usage in {@link AsHandler} decorator.
 */
export interface IHandlerDefinition {
  protocol: OCPPVersion;
  action: CallAction;
  method: Function;
  methodName: string;
}
