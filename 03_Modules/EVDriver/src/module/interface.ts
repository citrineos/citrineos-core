// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  ClearCacheRequest,
  IMessageConfirmation,
  RequestStartTransactionRequest,
  RequestStopTransactionRequest,
} from '@citrineos/base';

/**
 * Interface for the EVDriver module.
 */
export interface IEVDriverModuleApi {
  requestStartTransaction(identifier: string, tenantId: string, request: RequestStartTransactionRequest, callbackUrl?: string): Promise<IMessageConfirmation>;
  requestStopTransaction(identifier: string, tenantId: string, request: RequestStopTransactionRequest, callbackUrl?: string): Promise<IMessageConfirmation>;
  clearCache(identifier: string, tenantId: string, request: ClearCacheRequest, callbackUrl?: string): Promise<IMessageConfirmation>;
}
