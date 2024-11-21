// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {,
  IMessageConfirmation,
  OCPP2_0_1
} from '@citrineos/base';

/**
 * Interface for the EVDriver module.
 */
export interface IEVDriverModuleApi {
  requestStartTransaction(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.RequestStartTransactionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation>;
  requestStopTransaction(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.RequestStopTransactionRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation>;
  clearCache(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.ClearCacheRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation>;
}
