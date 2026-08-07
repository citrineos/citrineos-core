// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_0_1 } from '@citrineos/types';
import { Transaction } from '../../model/TransactionEvent/Transaction.js';

export class TransactionMapper {
  static toTransactionType(transaction: Transaction): OCPP2_0_1.TransactionType {
    return {
      transactionId: transaction.transactionId,
      chargingState: transaction.chargingState as OCPP2_0_1.ChargingStateEnumType,
      timeSpentCharging: transaction.timeSpentCharging,
      stoppedReason: transaction.stoppedReason as OCPP2_0_1.ReasonEnumType,
      remoteStartId: transaction.remoteStartId,
      customData: transaction.customData,
    };
  }
}
