import { Tariff } from '@citrineos/data';
import { faker } from '@faker-js/faker';

export function aTariff(override?: Partial<Tariff>): Tariff {
  return {
    id: faker.string.uuid(),
    currency: 'USD',
    pricePerKwh: faker.number.float({ min: 0, max: 5, multipleOf: 0.05 }),
    pricePerMin: faker.number.float({ min: 0, max: 1, multipleOf: 0.02 }),
    pricePerSession: faker.number.float({ min: 0, max: 25, multipleOf: 0.05 }),
    taxRate: faker.number.float({ min: 0, max: 100, multipleOf: 1 }),
    authorizationAmount: faker.number.float({ min: 0, max: 25, multipleOf: 1 }),
    paymentFee: faker.number.float({ min: 0, max: 25, multipleOf: 0.5 }),
    ...override,
  } as Tariff;
}
