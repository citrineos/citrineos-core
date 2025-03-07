import { OCPP2_0_1 } from '@citrineos/base';

import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { Transaction } from '@citrineos/data';

export function aTransaction(updateFunction?: UpdateFunction<Transaction>): Transaction {
  const item: Transaction = {
    id: faker.string.uuid(),
    stationId: faker.string.uuid(),
    transactionId: faker.string.uuid(),
    isActive: true,
    chargingState: OCPP2_0_1.ChargingStateEnumType.Charging,
    timeSpentCharging: faker.number.int({ min: 0, max: 10000 }),
    totalKwh: faker.number.float({ min: 0, max: 100 }),
    remoteStartId: faker.number.int({ min: 1, max: 1000 }),
  } as Transaction;

  return applyUpdateFunction(item, updateFunction);
}

export function aTransactionType(
  updateFunction?: UpdateFunction<OCPP2_0_1.TransactionType>,
): OCPP2_0_1.TransactionType {
  const item: OCPP2_0_1.TransactionType = {
    transactionId: faker.string.uuid(),
  };
  return applyUpdateFunction(item, updateFunction);
}

export function aTransactionEventRequest(
  updateFunction?: UpdateFunction<OCPP2_0_1.TransactionEventRequest>,
): OCPP2_0_1.TransactionEventRequest {
  const item: OCPP2_0_1.TransactionEventRequest = {
    eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
    timestamp: faker.date.recent().toISOString(),
    triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
    seqNo: faker.number.int({ min: 1, max: 1000 }),
    transactionInfo: aTransactionType(),
  };

  return applyUpdateFunction(item, updateFunction);
}
