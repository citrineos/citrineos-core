// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber } from 'class-validator';

/**
 * OCPP 1.6 RemoteStopTransaction request. Differs from 2.0.1's
 * `RequestStopTransactionRequest`: 1.6 uses a numeric transactionId.
 */
export class RemoteStopTransaction16Request {
  @IsNumber()
  transactionId: number;
}
