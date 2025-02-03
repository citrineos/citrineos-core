import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { faker } from '@faker-js/faker';
import { MeterValue } from '../../src';

export function aMeterValue(updateFunction?: UpdateFunction<MeterValue>): MeterValue {
  const meterValue: MeterValue = {
    transactionDatabaseId: faker.number.int({ min: 0, max: 100 }),
    transactionEventId: faker.number.int({ min: 0, max: 100 }),
    sampledValue: [...[aOcpp201SampledValue()]],
    timestamp: faker.date.recent().toISOString(),
    customData: { vendorId: faker.string.alpha(10) },
    connectorDatabaseId: faker.number.int({ min: 0, max: 5 }),
  } as MeterValue;

  return applyUpdateFunction(meterValue, updateFunction);
}

export function aOcpp201SampledValue(updateFunction?: UpdateFunction<object>): object {
  const sampledValue: object = {
    measurand: 'Energy.Active.Import.Register',
    phase: 'L1',
    unitOfMeasure: {
      unit: 'kWh',
      multiplier: faker.number.int({ min: 0, max: 100 }),
    },
    value: faker.number.int({ min: 0, max: 100 }),
    context: 'Transaction.Begin',
    location: 'Outlet',
  } as object;

  return applyUpdateFunction(sampledValue, updateFunction);
}

export function aOcpp16SampledValue(updateFunction?: UpdateFunction<object>): object {
  const sampledValue: object = {
    measurand: 'Energy.Active.Import.Register',
    phase: 'L1',
    unit: 'kWh',
    value: '79', // keep it fixed to pass the throw error test case
    context: 'Transaction.Begin',
    format: 'Raw',
    location: 'Outlet',
  } as object;

  return applyUpdateFunction(sampledValue, updateFunction);
}
