// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { Transaction } from '../../model/TransactionEvent';
import { ChargingStateEnumType, ReasonEnumType } from '@citrineos/base/src/ocpp/model/2.0.1';

export class TransactionMapper {
  static toTransactionType(transaction: Transaction): OCPP2_0_1.TransactionType {
    return {
      transactionId: transaction.transactionId,
      chargingState: transaction.chargingState as ChargingStateEnumType,
      timeSpentCharging: transaction.timeSpentCharging,
      stoppedReason: transaction.stoppedReason as ReasonEnumType,
      remoteStartId: transaction.remoteStartId,
      customData: transaction.customData,
    };
  }
}
