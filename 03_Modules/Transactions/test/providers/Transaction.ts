import { ChargingStateEnumType } from '@citrineos/base';

import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { Transaction } from '@citrineos/data';

export const aValidTransaction = (
  updateFunction?: UpdateFunction<Transaction>,
): Transaction => {
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
};
