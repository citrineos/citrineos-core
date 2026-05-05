// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsOptional, IsString } from 'class-validator';

/**
 * OCPP 2.0.1 / 2.1 GetTransactionStatus request. Returns whether the
 * transaction is `ongoing` and `messagesInQueue` per the spec.
 */
export class GetTransactionStatusRequest {
  @IsOptional()
  @IsString()
  transactionId?: string;
}
