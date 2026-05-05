// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsString } from 'class-validator';

/**
 * OCPP 2.0.1 / 2.1 RequestStopTransaction request — remotely stops an
 * in-progress session. The charger replies `Accepted` / `Rejected`; on
 * Accepted, expect a TransactionEvent.Ended with `stoppedReason="Remote"`.
 *
 * @example
 * { "transactionId": "5314dfa0-1e3f-4383-981f-6ba0b1394359" }
 */
export class RequestStopTransactionRequest {
  /**
   * Wire-level transaction id from the original Started event.
   * @example '5314dfa0-1e3f-4383-981f-6ba0b1394359'
   */
  @IsString()
  transactionId: string;
}
