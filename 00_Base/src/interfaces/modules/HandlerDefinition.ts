// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CallAction } from '../../ocpp/rpc/message';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AsHandler } from '.';

/**
 * Interface for usage in {@link AsHandler} decorator.
 */
export interface IHandlerDefinition {
    action: CallAction;
    // eslint-disable-next-line @typescript-eslint/ban-types
    method: Function;
    methodName: string;
}
