import {
  ChargingStateEnumType,
  TransactionEventEnumType,
  TransactionEventRequest,
  TransactionType,
  TriggerReasonEnumType,
} from '@citrineos/base';

import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { Transaction } from '@citrineos/data';

export function aTransaction(
  updateFunction?: UpdateFunction<Transaction>,
): Transaction {
  const item: Transaction = {
    id: faker.string.uuid(),
    stationId: faker.string.uuid(),
    transactionId: faker.string.uuid(),
    isActive: true,
    chargingState: ChargingStateEnumType.Charging,
    timeSpentCharging: faker.number.int({ min: 0, max: 10000 }),
    totalKwh: faker.number.float({ min: 0, max: 100 }),
    remoteStartId: faker.number.int({ min: 1, max: 1000 }),
  } as Transaction;

  return applyUpdateFunction(item, updateFunction);
}

export function aTransactionType(
  updateFunction?: UpdateFunction<TransactionType>,
): TransactionType {
  const item: TransactionType = {
    transactionId: faker.string.uuid(),
  };
  return applyUpdateFunction(item, updateFunction);
}

export function aTransactionEventRequest(
  updateFunction?: UpdateFunction<TransactionEventRequest>,
): TransactionEventRequest {
  const item: TransactionEventRequest = {
    eventType: TransactionEventEnumType.Updated,
    timestamp: faker.date.recent().toISOString(),
    triggerReason: TriggerReasonEnumType.MeterValuePeriodic,
    seqNo: faker.number.int({ min: 1, max: 1000 }),
    transactionInfo: aTransactionType(),
  };

  return applyUpdateFunction(item, updateFunction);
}
