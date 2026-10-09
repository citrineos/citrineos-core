// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { TransactionDto } from '@citrineos/types';

export function requireTransactionDatabaseId(transaction: TransactionDto): number {
  if (transaction.id == null) {
    throw new Error(`Transaction ${transaction.transactionId} has no database id`);
  }
  return transaction.id;
}
