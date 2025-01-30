// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  OCPP2_0_1,
  IMessageConfirmation,
} from '@citrineos/base';

/**
 * Interface for the transaction module.
 */
export interface ITransactionsModuleApi {
  getTransactionStatus(
    identifier: string[],
    tenantId: string,
    request: OCPP2_0_1.GetTransactionStatusRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]>;
}
