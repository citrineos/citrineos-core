import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { faker } from '@faker-js/faker';
import { MeterValue } from '../../src';

export function aMeterValue(updateFunction?: UpdateFunction<MeterValue>): MeterValue {
  const meterValue: MeterValue = {
    sampledValue: [...[aOcpp201SampledValue()]],
    timestamp: faker.date.recent().toISOString(),
    customData: {
      vendorId: faker.string.alphanumeric(5),
    },
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
      customData: {
        vendorId: faker.string.alphanumeric(5),
      },
    },
    value: faker.number.int({ min: 0, max: 100 }),
    context: 'Transaction.Begin',
    location: 'Outlet',
    signedMeterValue: {
      signedMeterData: faker.string.alphanumeric(5),
      signingMethod: faker.string.alphanumeric(5),
      encodingMethod: faker.string.alphanumeric(5),
      publicKey: faker.string.alphanumeric(5),
      customData: {
        vendorId: faker.string.alphanumeric(5),
      },
    },
    customData: {
      vendorId: faker.string.alphanumeric(5),
    },
  } as object;

  return applyUpdateFunction(sampledValue, updateFunction);
}
